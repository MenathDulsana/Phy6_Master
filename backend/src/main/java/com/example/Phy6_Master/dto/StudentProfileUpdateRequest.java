package com.example.Phy6_Master.dto;

import lombok.Data;

@Data
public class StudentProfileUpdateRequest {
    // User fields
    private String name;
    private String email;
    private String phoneNumber;

    // Student fields
    private String enrollmentNumber;
    private String school;
    private String batch;
    private String stream;
    private String address;
    private String parentName;
    private String parentPhoneNumber;

    // Password change (optional for logged-in students)
    private String newPassword;
}
