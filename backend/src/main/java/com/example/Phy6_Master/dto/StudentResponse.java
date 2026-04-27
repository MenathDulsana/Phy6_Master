package com.example.Phy6_Master.dto;

import com.example.Phy6_Master.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StudentResponse {
    private Long userId;
    private Long studentId;
    private String username;
    private String name;
    private String email;
    private String phoneNumber;
    private String enrollmentNumber;
    private String school;
    private String batch;
    private String stream;
    private String address;
    private String parentName;
    private String parentPhoneNumber;
    private User.Role role;
    private String message;
}
