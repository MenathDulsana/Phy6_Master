package com.example.Phy6_Master.service;

import com.example.Phy6_Master.dto.ATMTransferRequest;
import com.example.Phy6_Master.model.Course;
import com.example.Phy6_Master.model.Enrollment;
import com.example.Phy6_Master.model.Payment;
import com.example.Phy6_Master.model.User;
import com.example.Phy6_Master.repository.EnrollmentRepository;
import com.example.Phy6_Master.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final EnrollmentService enrollmentService;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;

    @Transactional
    public Payment processAtmTransfer(ATMTransferRequest request) {
        // 1. Fetch or Create Enrollment
        Enrollment enrollment = enrollmentService.createPendingEnrollment(request.getStudentId(), request.getClassId());
        
        if ("ACTIVE".equalsIgnoreCase(enrollment.getStatus()) || "APPROVED".equalsIgnoreCase(enrollment.getStatus())) {
            throw new IllegalStateException("Duplicate prevented: You already have an active enrollment for this class.");
        }
        
        Optional<Payment> existingPendingPayment = paymentRepository.findTopByEnrollmentOrderByPaymentDateDesc(enrollment);
        if (existingPendingPayment.isPresent() && "SUBMITTED".equalsIgnoreCase(existingPendingPayment.get().getStatus())) {
            throw new IllegalStateException("Duplicate prevented: You already have a pending payment waiting for verification.");
        }

        // Set status to PAYMENT_SUBMITTED indicating payment is undergoing verification
        enrollment.setStatus("PAYMENT_SUBMITTED");
        enrollmentRepository.save(enrollment); // explicit save so status is persisted before payment

        // Reuse the same payment row for this enrollment when it already exists
        // (schema may enforce unique enrollment_id in payments).
        Payment payment = existingPendingPayment.orElseGet(Payment::new);
        payment.setEnrollment(enrollment);
        payment.setAmount(request.getAmount());
        payment.setPaymentMethod("ATM_TRANSFER");
        payment.setStatus("SUBMITTED");
        payment.setReferenceNumber(request.getReferenceNumber());
        payment.setFilePath(null);
        payment.setRejectionReason(null);
        payment.setVerifiedAt(null);
        payment.setVerifiedBy(null);
        payment.setReceiptNumber(null);
        payment.setReceiptGeneratedAt(null);
        payment.setReceiptFilePath(null);
        payment.setPaymentDate(LocalDateTime.now());

        return paymentRepository.save(payment);
    }

    @Transactional
    public Payment processBankSlip(Long studentId, Long classId, Double amount, MultipartFile file) throws IOException {
        // 1. Fetch or Create Enrollment
        Enrollment enrollment = enrollmentService.createPendingEnrollment(studentId, classId);

        if ("ACTIVE".equalsIgnoreCase(enrollment.getStatus()) || "APPROVED".equalsIgnoreCase(enrollment.getStatus())) {
            throw new IllegalStateException("Duplicate prevented: You already have an active enrollment for this class.");
        }
        
        Optional<Payment> existingPendingPayment = paymentRepository.findTopByEnrollmentOrderByPaymentDateDesc(enrollment);
        if (existingPendingPayment.isPresent() && "SUBMITTED".equalsIgnoreCase(existingPendingPayment.get().getStatus())) {
            throw new IllegalStateException("Duplicate prevented: You already have a pending payment waiting for verification.");
        }

        // Set status to PAYMENT_SUBMITTED indicating payment is undergoing verification
        enrollment.setStatus("PAYMENT_SUBMITTED");
        enrollmentRepository.save(enrollment); // explicit save so status is persisted before payment

        // 2. Store the file locally
        String filePath = fileStorageService.storeFile(file);

        // Reuse the same payment row for this enrollment when it already exists
        // (schema may enforce unique enrollment_id in payments).
        Payment payment = existingPendingPayment.orElseGet(Payment::new);
        payment.setEnrollment(enrollment);
        payment.setAmount(amount);
        payment.setPaymentMethod("BANK_SLIP_UPLOAD");
        payment.setStatus("SUBMITTED");
        payment.setFilePath(filePath);
        payment.setReferenceNumber(null);
        payment.setRejectionReason(null);
        payment.setVerifiedAt(null);
        payment.setVerifiedBy(null);
        payment.setReceiptNumber(null);
        payment.setReceiptGeneratedAt(null);
        payment.setReceiptFilePath(null);
        payment.setPaymentDate(LocalDateTime.now());

        return paymentRepository.save(payment);
    }

    public String processOnlineCheckout(Long studentId, Long classId, Double amount) {
        return "Online payment will be implemented later";
    }

    @Transactional
    public Payment approvePayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        payment.setStatus("APPROVED");
        payment.setVerifiedAt(LocalDateTime.now());
        
        Enrollment enrollment = payment.getEnrollment();
        if (enrollment != null) {
            enrollment.setStatus("ACTIVE"); // Change from APPROVED to ACTIVE for consistency
            if (enrollment.getStudent() != null) {
                notificationService.createPaymentNotification(
                        enrollment.getStudent(),
                        payment,
                        enrollment.getCourse() != null ? enrollment.getCourse().getTitle() : "Your Class",
                        true);
            }
        }
        return paymentRepository.save(payment);
    }

    @Transactional
    public Payment rejectPayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        payment.setStatus("REJECTED");
        
        Enrollment enrollment = payment.getEnrollment();
        if (enrollment != null) {
            enrollment.setStatus("REJECTED");
            if (enrollment.getStudent() != null) {
                notificationService.createPaymentNotification(
                        enrollment.getStudent(),
                        payment,
                        enrollment.getCourse() != null ? enrollment.getCourse().getTitle() : "Your Class",
                        false);
            }
        }
        return paymentRepository.save(payment);
    }

    /**
     * Student withdraws / cancels their own submitted (but not yet actioned) payment.
     * Works for both manual (ATM/bank-slip) and Stripe abandoned sessions.
     * Sets payment → CANCELLED, enrollment → PENDING so the student can re-submit.
     */
    @Transactional
    public void withdrawPayment(Long studentId, Long courseId, String stripeSessionId) {
        Payment payment;

        if (stripeSessionId != null && !stripeSessionId.isBlank()) {
            // Stripe cancel path: look up by session ID
            payment = paymentRepository.findByStripeSessionId(stripeSessionId)
                    .orElseThrow(() -> new IllegalArgumentException("No payment found for this Stripe session"));
        } else {
            // Manual path: find the latest SUBMITTED payment for this student + course
            User student = new User();
            student.setId(studentId);
            Course course = new Course();
            course.setId(courseId);

            Enrollment enrollment = enrollmentRepository.findByStudentAndCourse(student, course)
                    .orElseThrow(() -> new IllegalArgumentException("No enrollment found"));

            payment = paymentRepository.findTopByEnrollmentOrderByPaymentDateDesc(enrollment)
                    .orElseThrow(() -> new IllegalArgumentException("No pending payment found"));
        }

        if ("APPROVED".equals(payment.getStatus()) || "REJECTED".equals(payment.getStatus())) {
            throw new IllegalStateException("This payment has already been actioned and cannot be withdrawn");
        }

        payment.setStatus("CANCELLED");
        paymentRepository.save(payment);

        Enrollment enrollment = payment.getEnrollment();
        if (enrollment != null) {
            enrollment.setStatus("PENDING");
            enrollmentRepository.save(enrollment);
        }
    }

    public java.util.List<com.example.Phy6_Master.dto.PaymentHistoryResponseDTO> getPaymentHistory(Long studentId) {
        com.example.Phy6_Master.model.User student = new com.example.Phy6_Master.model.User();
        student.setId(studentId);
        
        return paymentRepository.findByEnrollmentStudentOrderByPaymentDateDesc(student)
                .stream()
                .map(p -> new com.example.Phy6_Master.dto.PaymentHistoryResponseDTO(
                        p.getId(),
                        p.getEnrollment() != null && p.getEnrollment().getCourse() != null ? p.getEnrollment().getCourse().getId() : null,
                        p.getEnrollment() != null && p.getEnrollment().getCourse() != null ? p.getEnrollment().getCourse().getTitle() : "Unknown",
                        p.getAmount(),
                        p.getPaymentMethod(),
                        p.getStatus(),
                        p.getPaymentDate(),
                        p.getVerifiedAt(),
                        p.getRejectionReason()
                )).collect(java.util.stream.Collectors.toList());
    }
}
