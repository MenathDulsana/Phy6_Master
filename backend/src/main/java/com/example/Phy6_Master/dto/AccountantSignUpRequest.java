package com.example.Phy6_Master.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class AccountantSignUpRequest {
    @NotBlank
    private String name;

    @NotBlank
    private String username;

    @NotBlank
    private String password;

    @Email
    private String email;

    private String phoneNumber;

    private String department;
    private String qualification;
    private String designation;
    private String officeLocation;
}
