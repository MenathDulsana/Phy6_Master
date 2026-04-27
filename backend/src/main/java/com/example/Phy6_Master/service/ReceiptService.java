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

import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReceiptService {

    private final PaymentRepository paymentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final NotificationService notificationService;
    private final FileStorageService fileStorageService;

    @Transactional(noRollbackFor = Exception.class)
    public ReceiptResponseDTO generateReceipt(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        if (!"APPROVED".equals(payment.getStatus())) {
            throw new IllegalStateException("Receipts can only be generated for APPROVED payments");
        }

        if (payment.getReceiptNumber() != null) {
            ensureReceiptFileAvailable(payment);
            return mapToDto(payment);
        }

        String receiptNumber = "RCPT-" + LocalDateTime.now().getYear() + "-" + String.format("%06d", payment.getId());
        LocalDateTime generatedAt = LocalDateTime.now();
        payment.setReceiptNumber(receiptNumber);
        payment.setReceiptGeneratedAt(generatedAt);
        ensureReceiptFileAvailable(payment);
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
    
    public String getReceiptLocation(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
        if (payment.getReceiptNumber() == null || payment.getReceiptNumber().isBlank()) {
            throw new IllegalStateException("Receipt has not been generated for this payment");
        }
        ensureReceiptFileAvailable(payment);
        return payment.getReceiptFilePath();
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
        if (payment.getReceiptNumber() == null || payment.getReceiptNumber().isBlank()) {
            throw new IllegalStateException("No receipt has been issued for this payment yet.");
        }
    }

    private void ensureReceiptFileAvailable(Payment payment) {
        String existingPath = payment.getReceiptFilePath();
        if (existingPath != null && !existingPath.isBlank() && !isMissingLocalFile(existingPath)) {
            return;
        }

        LocalDateTime issueDate = payment.getReceiptGeneratedAt() != null ? payment.getReceiptGeneratedAt() : LocalDateTime.now();
        String receiptNumber = payment.getReceiptNumber();
        if (receiptNumber == null || receiptNumber.isBlank()) {
            receiptNumber = "RCPT-" + issueDate.getYear() + "-" + String.format("%06d", payment.getId());
            payment.setReceiptNumber(receiptNumber);
        }

        try {
            String storedLocation = buildAndStoreReceiptPdf(payment, receiptNumber, issueDate);
            payment.setReceiptGeneratedAt(issueDate);
            payment.setReceiptFilePath(storedLocation);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF receipt", e);
        }
    }

    private boolean isMissingLocalFile(String storedLocation) {
        if (storedLocation == null || storedLocation.isBlank()) {
            return true;
        }
        if (storedLocation.startsWith("http://") || storedLocation.startsWith("https://")) {
            return false;
        }
        String normalized = storedLocation.replace("\\", "/");
        Path path = Paths.get(normalized).toAbsolutePath().normalize();
        return !Files.exists(path) || !Files.isReadable(path);
    }

    private String buildAndStoreReceiptPdf(Payment payment, String receiptNumber, LocalDateTime issueDate) throws Exception {
        Document document = new Document();
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, outputStream);
        document.open();

        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20);
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 12);

        document.add(new Paragraph("Phy6 Master - Official Receipt", titleFont));
        document.add(new Paragraph("\n"));
        document.add(new Paragraph("Receipt Number: " + receiptNumber, normalFont));
        document.add(new Paragraph("Issue Date: " + issueDate.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")), normalFont));
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

        String fileName = receiptNumber + ".pdf";
        return fileStorageService.storeBytes(
                outputStream.toByteArray(),
                "application/pdf",
                "receipts",
                fileName
        );
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
