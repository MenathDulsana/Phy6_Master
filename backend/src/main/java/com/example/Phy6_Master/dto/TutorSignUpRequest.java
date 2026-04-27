package com.example.Phy6_Master.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class TutorSignUpRequest {
    @NotBlank
    private String name;

    @NotBlank
    private String username;

    @NotBlank
    private String password;

    @Email
    private String email;

    private String phoneNumber;

    private String specialization;
    private String qualification;
    private String experience;
    private Double hourlyRate;
    private String bio;
}
