package com.example.Phy6_Master.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PaymentPendingListResponseDTO {
    private Long id;
    private String studentName;
    private String courseName;
    private String paymentMethod;
    private LocalDateTime submissionDate;
    private String status;

    public PaymentPendingListResponseDTO(Long id, String studentName, String courseName, String paymentMethod,
            LocalDateTime submissionDate, String status) {
        this.id = id;
        this.studentName = studentName;
        this.courseName = courseName;
        this.paymentMethod = paymentMethod;
        this.submissionDate = submissionDate;
        this.status = status;
    }
}
