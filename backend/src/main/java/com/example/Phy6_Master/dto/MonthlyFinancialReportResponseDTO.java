package com.example.Phy6_Master.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyFinancialReportResponseDTO {
    private int month;
    private int year;
    private Long courseId;
    private String courseName;
    private String paymentMethod;
    private Double totalFeesCollected;
    private long pendingPaymentsCount;
    private long rejectedPaymentsCount;
    private long approvedPaymentsCount;
    private long totalPaymentsCount;
    private long enrollmentCount;
    private LocalDateTime reportGeneratedAt;
    private String message;
}
