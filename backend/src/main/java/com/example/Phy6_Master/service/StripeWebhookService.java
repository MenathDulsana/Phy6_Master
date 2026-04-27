package com.example.Phy6_Master.service;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Charge;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.example.Phy6_Master.model.Enrollment;
import com.example.Phy6_Master.model.Payment;
import com.example.Phy6_Master.repository.EnrollmentRepository;
import com.example.Phy6_Master.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Service for handling Stripe webhook events.
 * Processes payment confirmations, updates payment/enrollment status,
 * and creates notifications automatically.
 */
@Service
@RequiredArgsConstructor
public class StripeWebhookService {
    
    private final PaymentRepository paymentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    @Value("${stripe.webhook.secret}")
    private String webhookSecret;

    /**
     * Verify Stripe webhook signature and process the event.
     * 
     * @param payload Raw webhook payload from Stripe
     * @param sigHeader Stripe signature header (Stripe-Signature HTTP header)
     * @return true if event was processed successfully, false otherwise
     */
    public boolean processWebhook(String payload, String sigHeader) {
        try {
            // 1. Verify webhook signature
            Event event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
            
            // 2. Process based on event type
            if ("checkout.session.completed".equals(event.getType())) {
                return handleCheckoutSessionCompleted(event);
            }
            if ("charge.refunded".equals(event.getType())) {
                return handleChargeRefunded(event);
            }
            
            // Log unhandled event types
            System.out.println("Received unhandled event type: " + event.getType());
            return true;
            
        } catch (SignatureVerificationException e) {
            System.err.println("Webhook signature verification failed: " + e.getMessage());
            return false;
        } catch (Exception e) {
            System.err.println("Webhook processing error: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Handle checkout.session.completed event from Stripe.
     * This is triggered when customer successfully completes payment.
     * Must be public so Spring's proxy can apply @Transactional.
     */
    @Transactional
    public boolean handleCheckoutSessionCompleted(Event event) {
        try {
            // Extract session data from event
            Session session = (Session) event.getDataObjectDeserializer()
                    .getObject()
                    .orElseThrow(() -> new IllegalStateException("Failed to deserialize event data"));
            
            String sessionId = session.getId();
            String paymentStatus = session.getPaymentStatus();
            
            // Only process if payment is actually paid
            if (!"paid".equals(paymentStatus)) {
                System.out.println("Payment status is not 'paid': " + paymentStatus);
                return true;
            }
            
            // 1. Find our Payment record by Stripe session ID
            Optional<Payment> paymentOpt = paymentRepository.findByStripeSessionId(sessionId);
            if (!paymentOpt.isPresent()) {
                System.err.println("Payment not found for Stripe session: " + sessionId);
                return false;
            }
            
            Payment payment = paymentOpt.get();
            
            // 2. Prevent duplicate processing of the same webhook
            if (payment.getStripeWebhookProcessed() != null && payment.getStripeWebhookProcessed()) {
                System.out.println("Webhook already processed for payment: " + payment.getId());
                return true;
            }
            
            // 3. Update Payment record — mark as APPROVED by Stripe, but accountant still issues receipt
            payment.setStatus("APPROVED");
            payment.setStripePaymentIntentId(session.getPaymentIntent());
            payment.setStripeWebhookProcessed(true);
            payment.setVerifiedAt(LocalDateTime.now());

            // 4. Keep enrollment non-active until official receipt is issued (generateReceipt activates it)
            Enrollment enrollment = payment.getEnrollment();
            if (enrollment != null && !"ACTIVE".equals(enrollment.getStatus())) {
                enrollment.setStatus("PAYMENT_SUBMITTED");
                enrollmentRepository.save(enrollment);
            }

            // 5. Save payment
            paymentRepository.save(payment);

            System.out.println("Stripe webhook: payment " + payment.getId() + " marked APPROVED. Awaiting accountant receipt.");
            return true;
            
        } catch (Exception e) {
            System.err.println("Error handling checkout.session.completed: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Handle charge.refunded event from Stripe.
     * Triggered when a previously captured charge is refunded (fully or partially).
     */
    @Transactional
    public boolean handleChargeRefunded(Event event) {
        try {
            Charge charge = (Charge) event.getDataObjectDeserializer()
                    .getObject()
                    .orElseThrow(() -> new IllegalStateException("Failed to deserialize charge data"));

            String paymentIntentId = charge.getPaymentIntent();
            if (paymentIntentId == null) {
                System.out.println("charge.refunded: no payment_intent on charge, skipping");
                return true;
            }

            Optional<Payment> paymentOpt = paymentRepository.findByStripePaymentIntentId(paymentIntentId);
            if (!paymentOpt.isPresent()) {
                System.err.println("charge.refunded: no local payment found for intent " + paymentIntentId);
                return true; // not our payment — ignore gracefully
            }

            Payment payment = paymentOpt.get();
            payment.setStatus("REFUNDED");
            paymentRepository.save(payment);

            // Revoke enrollment so the student must re-enroll / re-pay
            Enrollment enrollment = payment.getEnrollment();
            if (enrollment != null) {
                enrollment.setStatus("PENDING");
                enrollmentRepository.save(enrollment);

                // Notify student
                if (enrollment.getStudent() != null) {
                    String courseName = enrollment.getCourse() != null ? enrollment.getCourse().getTitle() : "your class";
                    notificationService.createPaymentNotification(
                            enrollment.getStudent(),
                            payment,
                            courseName,
                            false,
                            "Your Stripe payment has been refunded. Please re-submit payment if you wish to continue."
                    );
                }
            }

            System.out.println("Stripe webhook: payment " + payment.getId() + " marked REFUNDED.");
            return true;

        } catch (Exception e) {
            System.err.println("Error handling charge.refunded: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
}
