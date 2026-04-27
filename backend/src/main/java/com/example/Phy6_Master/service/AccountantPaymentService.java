package com.example.Phy6_Master.service;

import com.example.Phy6_Master.dto.AccountantPaymentDetailResponseDTO;
import com.example.Phy6_Master.dto.PaymentPendingListResponseDTO;
import com.example.Phy6_Master.model.Enrollment;
import com.example.Phy6_Master.model.Payment;
import com.example.Phy6_Master.repository.PaymentRepository;
import com.example.Phy6_Master.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AccountantPaymentService {

    private static final Logger log = LoggerFactory.getLogger(AccountantPaymentService.class);

    private final PaymentRepository paymentRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final ReceiptService receiptService;

    public List<PaymentPendingListResponseDTO> getPendingPayments() {
        // All SUBMITTED payments (ATM, Bank Slip, and Online/Stripe when webhook hasn't fired yet)
        List<String> allPaymentMethods = java.util.Arrays.asList(
                "ATM_TRANSFER", "BANK_SLIP_UPLOAD", "BANK_SLIP", "ONLINE_PAYMENT");
        List<Payment> submittedPending = paymentRepository.findByStatusAndPaymentMethodInOrderByPaymentDateAsc(
                "SUBMITTED", allPaymentMethods);

        // Stripe payments confirmed by webhook (APPROVED) but no receipt yet — accountant issues receipt
        List<Payment> stripePending = paymentRepository.findByStatusAndPaymentMethodInOrderByPaymentDateAsc(
                "APPROVED", java.util.Arrays.asList("ONLINE_PAYMENT"))
                .stream()
                .filter(p -> p.getReceiptNumber() == null || p.getReceiptNumber().trim().isEmpty())
                .collect(Collectors.toList());

        // Merge and sort globally by payment date ascending (oldest first per US-45)
        List<Payment> combined = new java.util.ArrayList<>();
        combined.addAll(submittedPending);
        combined.addAll(stripePending);
        combined.sort(java.util.Comparator.comparing(
                p -> p.getPaymentDate() != null ? p.getPaymentDate() : java.time.LocalDateTime.MIN));

        return combined.stream()
                .map(payment -> {
                    String studentName = payment.getEnrollment() != null && payment.getEnrollment().getStudent() != null
                            ? payment.getEnrollment().getStudent().getName()
                            : "Unknown";
                    String courseName = payment.getEnrollment() != null && payment.getEnrollment().getCourse() != null
                            ? payment.getEnrollment().getCourse().getTitle()
                            : "Unknown";

                    return new PaymentPendingListResponseDTO(
                            payment.getId(),
                            studentName,
                            courseName,
                            payment.getPaymentMethod(),
                            payment.getPaymentDate(),
                            payment.getStatus());
                }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AccountantPaymentDetailResponseDTO getPaymentDetail(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        AccountantPaymentDetailResponseDTO dto = new AccountantPaymentDetailResponseDTO();
        dto.setId(payment.getId());
        dto.setAmount(payment.getAmount());
        dto.setPaymentMethod(payment.getPaymentMethod());
        dto.setReferenceNumber(payment.getReferenceNumber());
        dto.setSubmissionDate(payment.getPaymentDate());
        dto.setProofFilePath(payment.getFilePath());
        dto.setHasProof(payment.getFilePath() != null && !payment.getFilePath().trim().isEmpty());

        Enrollment enrollment = payment.getEnrollment();
        if (enrollment != null) {
            if (enrollment.getStudent() != null) {
                dto.setStudentName(enrollment.getStudent().getName());
                dto.setStudentEmail(enrollment.getStudent().getEmail());
            }
            if (enrollment.getCourse() != null) {
                dto.setCourseName(enrollment.getCourse().getTitle());
            }
        }
        
        dto.setStatus(payment.getStatus());
        dto.setRejectionReason(payment.getRejectionReason());
        dto.setReceiptNumber(payment.getReceiptNumber());
        
        return dto;
    }

    @Transactional
    public void approvePayment(Long paymentId, Long accountantId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        if (!"SUBMITTED".equals(payment.getStatus())) {
            throw new IllegalStateException("Payment has already been actioned");
        }

        payment.setStatus("APPROVED");
        payment.setVerifiedAt(LocalDateTime.now());

        if (accountantId != null) {
            userRepository.findById(accountantId).ifPresent(payment::setVerifiedBy);
        }

        Enrollment enrollment = payment.getEnrollment();
        if (enrollment != null) {
            enrollment.setStatus("ACTIVE");
            if (enrollment.getStudent() != null) {
                notificationService.createPaymentNotification(
                        enrollment.getStudent(),
                        payment,
                        enrollment.getCourse() != null ? enrollment.getCourse().getTitle() : "Your Class",
                        true);
            }
        }
        paymentRepository.save(payment);

        // Auto-generate receipt for all approved payments
        try {
            receiptService.generateReceipt(paymentId);
        } catch (Exception e) {
            log.warn("Could not auto-generate receipt for payment {}: {}", paymentId, e.getMessage());
        }
    }

    @Transactional
    public void rejectPayment(Long paymentId, String rejectionReason, Long accountantId) {
        if (rejectionReason == null || rejectionReason.trim().isEmpty()) {
            throw new IllegalArgumentException("Rejection reason is required");
        }

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        if (!"SUBMITTED".equals(payment.getStatus())) {
            throw new IllegalStateException("Payment has already been actioned");
        }

        payment.setStatus("REJECTED");
        payment.setRejectionReason(rejectionReason);
        payment.setVerifiedAt(LocalDateTime.now());

        if (accountantId != null) {
            userRepository.findById(accountantId).ifPresent(payment::setVerifiedBy);
        }

        Enrollment enrollment = payment.getEnrollment();
        if (enrollment != null) {
            // Keep enrollment pending or reject it. Convention: REJECTED so they must
            // request again.
            enrollment.setStatus("REJECTED");
            if (enrollment.getStudent() != null) {
                notificationService.createPaymentNotification(
                        enrollment.getStudent(),
                        payment,
                        enrollment.getCourse() != null ? enrollment.getCourse().getTitle() : "Your Class",
                        false,
                        rejectionReason);
            }
        }
        paymentRepository.save(payment);
    }

    public List<com.example.Phy6_Master.dto.AccountantPaymentHistoryResponseDTO> getFilteredPaymentHistory(
            String studentName, String courseName, String paymentMethod, 
            String status, LocalDateTime startDate, LocalDateTime endDate) {
        
        if (studentName == null) studentName = "";
        if (courseName == null) courseName = "";
        if (paymentMethod == null || paymentMethod.isEmpty() || paymentMethod.equals("ALL")) paymentMethod = "ALL";
        if (status == null || status.isEmpty() || status.equals("ALL")) status = "ALL";
        if (startDate == null) startDate = LocalDateTime.of(2000, 1, 1, 0, 0);
        if (endDate == null) endDate = LocalDateTime.of(2100, 1, 1, 0, 0);

        List<Payment> filteredPayments = paymentRepository.findPaymentsByFilters(
                studentName, courseName, paymentMethod, status, startDate, endDate);
        
        return filteredPayments.stream()
            .map(p -> new com.example.Phy6_Master.dto.AccountantPaymentHistoryResponseDTO(
                    p.getId(),
                    p.getEnrollment() != null && p.getEnrollment().getStudent() != null ? p.getEnrollment().getStudent().getId() : null,
                    p.getEnrollment() != null && p.getEnrollment().getStudent() != null ? p.getEnrollment().getStudent().getName() : "Unknown",
                    p.getEnrollment() != null && p.getEnrollment().getCourse() != null ? p.getEnrollment().getCourse().getId() : null,
                    p.getEnrollment() != null && p.getEnrollment().getCourse() != null ? p.getEnrollment().getCourse().getTitle() : "Unknown",
                    p.getAmount(),
                    p.getPaymentMethod(),
                    p.getReferenceNumber(),
                    p.getStatus(),
                    p.getVerifiedBy() != null ? p.getVerifiedBy().getName() : null,
                    p.getPaymentDate(),
                    p.getVerifiedAt(),
                    p.getRejectionReason(),
                    p.getReceiptNumber()
            )).collect(Collectors.toList());
    }
}
