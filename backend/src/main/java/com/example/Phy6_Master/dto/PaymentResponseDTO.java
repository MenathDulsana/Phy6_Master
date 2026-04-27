package com.example.Phy6_Master.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PaymentResponseDTO {
    private boolean success;
    private String message;
    private Long paymentId;
    private Long enrollmentId;
}
