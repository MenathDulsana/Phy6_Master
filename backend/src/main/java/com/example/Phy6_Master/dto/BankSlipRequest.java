package com.example.Phy6_Master.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class BankSlipRequest {
    private Long classId;
    private Long studentId;
    private Double amount;
    private MultipartFile file;
}
