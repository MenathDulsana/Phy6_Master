package com.example.Phy6_Master.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDetailResponseDTO {
    private Long id;
    private Long courseId;
    private String courseName;
    private Double amount;
    private String paymentMethod;
    private String referenceNumber;
    private String proofFilePath;
    private LocalDateTime transferDate;
    private String status;
    private String rejectionReason;
    private LocalDateTime submittedAt;
    private LocalDateTime verifiedAt;
}
