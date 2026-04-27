package com.example.Phy6_Master.dto;

import lombok.Data;

@Data
public class ATMTransferRequest {
    private Long classId;
    private Long studentId;
    private Double amount;
    private String referenceNumber;
}
