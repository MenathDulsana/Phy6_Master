package com.example.Phy6_Master.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccountantPaymentDetailResponseDTO {
    private Long id;
    private Double amount;
    private String paymentMethod;
    private String referenceNumber;
    private LocalDateTime submissionDate;
    private String proofFilePath;
    private boolean hasProof;
    private String studentName;
    private String studentEmail;
    private String courseName;
    private String status;
    private String rejectionReason;
    private String receiptNumber;
}
