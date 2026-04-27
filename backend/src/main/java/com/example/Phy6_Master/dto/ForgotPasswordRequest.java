package com.example.Phy6_Master.dto;

import lombok.Data;

@Data
public class ForgotPasswordRequest {
    private String identifier; // username or email
}
