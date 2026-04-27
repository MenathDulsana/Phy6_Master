package com.example.Phy6_Master.service;

import com.example.Phy6_Master.dto.ReceiptResponseDTO;
import com.example.Phy6_Master.model.Enrollment;
import com.example.Phy6_Master.model.Payment;
import com.example.Phy6_Master.model.User;
import com.example.Phy6_Master.repository.EnrollmentRepository;
import com.example.Phy6_Master.repository.PaymentRepository;
import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.FileOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReceiptService {

    private final PaymentRepository paymentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final NotificationService notificationService;

    private final String RECEIPT_DIR = "uploads/receipts/";

    @Transactional
    public ReceiptResponseDTO generateReceipt(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        if (!"APPROVED".equals(payment.getStatus())) {
            throw new IllegalStateException("Receipts can only be generated for APPROVED payments");
        }

        if (payment.getReceiptNumber() != null) {
            // Already generated, return existing
            return mapToDto(payment);
        }

        // Generate receipt details
        String receiptNumber = "RCPT-" + LocalDateTime.now().getYear() + "-" + String.format("%06d", payment.getId());
        LocalDateTime generatedAt = LocalDateTime.now();

        // Create PDF
        String fileName = receiptNumber + ".pdf";
        String filePath = RECEIPT_DIR + fileName;

        try {
            File dir = new File(RECEIPT_DIR);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            Document document = new Document();
            PdfWriter.getInstance(document, new FileOutputStream(filePath));
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 12);

            document.add(new Paragraph("Phy6 Master - Official Receipt", titleFont));
            document.add(new Paragraph("\n"));
            document.add(new Paragraph("Receipt Number: " + receiptNumber, normalFont));
            document.add(new Paragraph("Issue Date: " + generatedAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")), normalFont));
            document.add(new Paragraph("--------------------------------------------------", normalFont));
            
            String studentName = payment.getEnrollment() != null && payment.getEnrollment().getStudent() != null 
                    ? payment.getEnrollment().getStudent().getName() : "Unknown";
            String courseTitle = payment.getEnrollment() != null && payment.getEnrollment().getCourse() != null 
                    ? payment.getEnrollment().getCourse().getTitle() : "Unknown";
            
            document.add(new Paragraph("Student Name: " + studentName, normalFont));
            document.add(new Paragraph("Course / Class: " + courseTitle, normalFont));
            document.add(new Paragraph("Amount Paid: Rs. " + payment.getAmount(), normalFont));
            document.add(new Paragraph("Payment Method: " + payment.getPaymentMethod(), normalFont));
            document.add(new Paragraph("Approval Date: " + (payment.getVerifiedAt() != null ? payment.getVerifiedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : "N/A"), normalFont));
            
            if (payment.getReferenceNumber() != null) {
                document.add(new Paragraph("Payment Reference: " + payment.getReferenceNumber(), normalFont));
            }
            
            document.add(new Paragraph("\n"));
            document.add(new Paragraph("Thank you for choosing Phy6 Master!", normalFont));
            document.close();
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF receipt", e);
        }

        payment.setReceiptNumber(receiptNumber);
        payment.setReceiptGeneratedAt(generatedAt);
        payment.setReceiptFilePath(filePath);
        paymentRepository.save(payment);

        // Activate the enrollment so the student gets class access
        Enrollment enrollment = payment.getEnrollment();
        if (enrollment != null && !"ACTIVE".equals(enrollment.getStatus())) {
            enrollment.setStatus("ACTIVE");
            enrollmentRepository.save(enrollment);
        }

        if (enrollment != null && enrollment.getStudent() != null) {
            try {
                String courseTitle = enrollment.getCourse() != null ? enrollment.getCourse().getTitle() : "Your Class";
                notificationService.createReceiptReadyNotification(
                        enrollment.getStudent(), payment, courseTitle, receiptNumber);
            } catch (Exception e) {
                log.warn("Receipt issued but notification failed for payment {}: {}", paymentId, e.getMessage());
            }
        }

        return mapToDto(payment);
    }

    public ReceiptResponseDTO getReceiptInfo(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
        if (payment.getReceiptNumber() == null) {
            throw new IllegalStateException("Receipt has not been generated for this payment");
        }
        return mapToDto(payment);
    }
    
    public java.nio.file.Path getReceiptFilePath(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
        if (payment.getReceiptFilePath() == null) {
            throw new IllegalStateException("Receipt file not found");
        }
        return java.nio.file.Paths.get(payment.getReceiptFilePath());
    }

    /**
     * Ensures the logged-in student owns this payment and may download the receipt PDF.
     */
    @Transactional(readOnly = true)
    public void verifyStudentReceiptAccess(Long paymentId, Long studentUserId) throws IllegalAccessException {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
        User student = payment.getEnrollment() != null ? payment.getEnrollment().getStudent() : null;
        if (student == null || !student.getId().equals(studentUserId)) {
            throw new IllegalAccessException("You do not have access to this receipt.");
        }
        if (!"APPROVED".equals(payment.getStatus())) {
            throw new IllegalStateException("Receipts are only available for approved payments.");
        }
        if (payment.getReceiptFilePath() == null || payment.getReceiptFilePath().isBlank()) {
            throw new IllegalStateException("No receipt has been issued for this payment yet.");
        }
    }

    private ReceiptResponseDTO mapToDto(Payment payment) {
        String studentName = payment.getEnrollment() != null && payment.getEnrollment().getStudent() != null 
                ? payment.getEnrollment().getStudent().getName() : "Unknown";
        String courseTitle = payment.getEnrollment() != null && payment.getEnrollment().getCourse() != null 
                ? payment.getEnrollment().getCourse().getTitle() : "Unknown";
                
        return new ReceiptResponseDTO(
                payment.getId(),
                payment.getReceiptNumber(),
                studentName,
                courseTitle,
                payment.getAmount(),
                payment.getPaymentMethod(),
                payment.getVerifiedAt(),
                payment.getReceiptGeneratedAt(),
                "/api/accountant/receipts/" + payment.getId() + "/download"
        );
    }
}
