package com.example.Phy6_Master.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class TeacherSignUpRequest {
    @NotBlank
    private String name;

    @NotBlank
    private String username;

    @NotBlank
    private String password;

    @Email
    private String email;

    private String phoneNumber;

    // Teacher login credentials (email + password)
    @Email
    @NotBlank
    private String teacherEmail;

    @NotBlank
    private String teacherPassword;

    private String qualification;
    private String specialization;
    private String department;
    private String experience;
    private String office;
    private String officePhoneNumber;
}
