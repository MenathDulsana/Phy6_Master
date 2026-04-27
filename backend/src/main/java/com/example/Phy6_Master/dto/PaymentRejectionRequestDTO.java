package com.example.Phy6_Master.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PaymentRejectionRequestDTO {
    @NotBlank(message = "Rejection reason is required")
    private String rejectionReason;
}
