package com.example.Phy6_Master.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccountantPaymentHistoryResponseDTO {
    private Long id;
    private Long studentId;
    private String studentName;
    private Long courseId;
    private String courseName;
    private Double amount;
    private String paymentMethod;
    private String referenceNumber;
    private String status;
    private String verifiedBy;
    private LocalDateTime submittedAt;
    private LocalDateTime verifiedAt;
    private String rejectionReason;
    private String receiptNumber;
}
