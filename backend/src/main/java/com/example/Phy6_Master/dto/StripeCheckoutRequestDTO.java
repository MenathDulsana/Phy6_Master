package com.example.Phy6_Master.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StripeCheckoutRequestDTO {
    private Long studentId;
    private Long classId;
    private Double amount;
}
