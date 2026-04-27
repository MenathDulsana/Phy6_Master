package com.example.Phy6_Master.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentHistoryResponseDTO {
    private Long id;
    private Long courseId;
    private String courseName;
    private Double amount;
    private String paymentMethod;
    private String status;
    private LocalDateTime submittedAt;
    private LocalDateTime verifiedAt;
    private String rejectionReason;
}
