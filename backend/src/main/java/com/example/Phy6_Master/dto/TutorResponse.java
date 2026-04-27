package com.example.Phy6_Master.dto;

import com.example.Phy6_Master.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TutorResponse {
    private Long userId;
    private Long tutorId;
    private String username;
    private String name;
    private String email;
    private String phoneNumber;
    private String specialization;
    private String qualification;
    private String experience;
    private Double hourlyRate;
    private String bio;
    private User.Role role;
    private String message;
}
