package com.example.Phy6_Master.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AuthSignInRequest {
    @NotBlank
    private String username;

    @NotBlank
    private String password;
}
