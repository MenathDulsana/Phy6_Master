package com.example.Phy6_Master.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ForgotPasswordResponse {
    private String message;
    private String resetToken;
    private Integer expiresInMinutes;
}
