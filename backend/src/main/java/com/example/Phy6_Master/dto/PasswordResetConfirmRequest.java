package com.example.Phy6_Master.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PasswordResetConfirmRequest {

    @NotBlank
    private String usernameOrEmail;

    @NotBlank
    @Pattern(regexp = "\\d{6}")
    private String verificationCode;

    @NotBlank
    @Size(min = 6)
    private String newPassword;
}
