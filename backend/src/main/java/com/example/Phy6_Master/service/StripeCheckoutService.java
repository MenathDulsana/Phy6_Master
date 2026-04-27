package com.example.Phy6_Master.service;

import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import com.example.Phy6_Master.dto.StripeCheckoutRequestDTO;
import com.example.Phy6_Master.dto.StripeCheckoutResponseDTO;
import com.example.Phy6_Master.model.Course;
import com.example.Phy6_Master.model.Enrollment;
import com.example.Phy6_Master.model.Payment;
import com.example.Phy6_Master.model.User;
import com.example.Phy6_Master.repository.CourseRepository;
import com.example.Phy6_Master.repository.EnrollmentRepository;
import com.example.Phy6_Master.repository.PaymentRepository;
import com.example.Phy6_Master.repository.UserRepository;
import com.example.Phy6_Master.util.PaymentAmounts;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Service for handling Stripe Checkout Session creation.
 * Creates a new Payment record with pending Stripe payment,
 * initializes Stripe Checkout Session, and returns session details to frontend.
 */
@Service
@RequiredArgsConstructor
public class StripeCheckoutService {

    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentService enrollmentService;

    @Value("${stripe.publishable.key}")
    private String stripePublishableKey;

    @Value("${stripe.success.url}")
    private String stripeSuccessUrl;

    @Value("${stripe.cancel.url}")
    private String stripeCancelUrl;

    /**
     * Create a Stripe Checkout Session for the given student and class.
     * 
     * @param request StripeCheckoutRequestDTO with studentId, classId, amount
     * @return StripeCheckoutResponseDTO with sessionId and clientSecret
     */
    @Transactional(rollbackFor = Exception.class)
    public StripeCheckoutResponseDTO createCheckoutSession(StripeCheckoutRequestDTO request) 
            throws StripeException {
        
        PaymentAmounts.requireStripeCheckoutAmount(request.getAmount());

        // 1. Validate student and course exist
        User student = userRepository.findById(request.getStudentId())
                .orElseThrow(() -> new IllegalArgumentException("Student not found"));
        
        Course course = courseRepository.findById(request.getClassId())
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));
        
        // 2. Check for duplicate enrollment (prevent multiple payments for same class)
        Enrollment enrollment = enrollmentService.createPendingEnrollment(
                request.getStudentId(), 
                request.getClassId()
        );
        
        if ("ACTIVE".equalsIgnoreCase(enrollment.getStatus()) || 
            "APPROVED".equalsIgnoreCase(enrollment.getStatus())) {
            throw new IllegalStateException("Duplicate prevented: You already have an active enrollment for this class.");
        }
        
        // Check if payment already exists for this enrollment
        Optional<Payment> existingPayment = paymentRepository.findByEnrollmentAndPaymentMethod(
                enrollment, 
                "ONLINE_PAYMENT"
        );
        
        if (existingPayment.isPresent() && "SUBMITTED".equalsIgnoreCase(existingPayment.get().getStatus())) {
            throw new IllegalStateException("Duplicate prevented: You already have a pending Stripe payment for this class.");
        }
        
        // 3. Create or update Payment record for this Stripe session
        Payment payment;
        if (existingPayment.isPresent()) {
            // Reuse existing payment record if it was rejected
            payment = existingPayment.get();
        } else {
            payment = new Payment();
        }
        
        payment.setEnrollment(enrollment);
        payment.setAmount(request.getAmount());
        payment.setPaymentMethod("ONLINE_PAYMENT");
        payment.setStatus("SUBMITTED"); // Will be updated to APPROVED after webhook
        payment.setPaymentDate(LocalDateTime.now());
        
        // Set enrollment to PAYMENT_SUBMITTED status
        enrollment.setStatus("PAYMENT_SUBMITTED");
        
        // Save payment first to get ID
        payment = paymentRepository.save(payment);
        
        // 4. Create Stripe Checkout Session
        Session session = createStripeSession(
                student,
                course,
                payment,
                request.getAmount()
        );
        
        // 5. Update payment with Stripe session details
        payment.setStripeSessionId(session.getId());
        if (session.getPaymentIntent() != null) {
            payment.setStripePaymentIntentId(session.getPaymentIntent());
        }
        paymentRepository.save(payment);
        
        // 6. Return response with session details
        StripeCheckoutResponseDTO response = new StripeCheckoutResponseDTO();
        response.setSessionId(session.getId());
        response.setPaymentId(payment.getId());
        response.setClientSecret(stripePublishableKey); // Frontend uses this to initialize Stripe
        if (session.getUrl() != null) {
            response.setRedirectUrl(session.getUrl());
        }
        
        return response;
    }
    
    /**
     * Internal method to create Stripe Checkout Session.
     */
    private Session createStripeSession(
            User student,
            Course course,
            Payment payment,
            Double amount
    ) throws StripeException {
        
        // Amount in cents (Stripe expects amount in subunits)
        long amountCents = Math.round(amount * 100);
        
        // Create checkout session params builder
        SessionCreateParams.Builder paramsBuilder = SessionCreateParams.builder()
                .addPaymentMethodType(SessionCreateParams.PaymentMethodType.CARD)
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(stripeSuccessUrl + "?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(stripeCancelUrl + "?session_id={CHECKOUT_SESSION_ID}")
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setQuantity(1L)
                                .setPriceData(
                                        SessionCreateParams.LineItem.PriceData.builder()
                                                .setCurrency("lkr")
                                                .setUnitAmount(amountCents)
                                                .setProductData(
                                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                .setName("Class Payment: " + course.getTitle())
                                                                .setDescription("Payment for enrollment in " + course.getTitle())
                                                                .build()
                                                )
                                                .build()
                                )
                                .build()
                )
                .setClientReferenceId(String.valueOf(payment.getId()));
        
        // Only pre-fill email if it looks valid to prevent Stripe API crashes
        if (student.getEmail() != null && student.getEmail().contains("@") && student.getEmail().contains(".")) {
            paramsBuilder.setCustomerEmail(student.getEmail());
        }
        
        return Session.create(paramsBuilder.build());
    }
}
