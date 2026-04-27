package com.example.Phy6_Master.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReceiptResponseDTO {
    private Long paymentId;
    private String receiptNumber;
    private String studentName;
    private String courseName;
    private Double amount;
    private String paymentMethod;
    private LocalDateTime approvalDate;
    private LocalDateTime generatedAt;
    private String receiptDownloadUrl;
}
