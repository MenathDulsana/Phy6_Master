package com.example.Phy6_Master.dto;

import com.example.Phy6_Master.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TeacherResponse {
    private Long userId;
    private Long teacherId;
    private String username;
    private String name;
    private String email;
    private String phoneNumber;

    // Teacher login email
    private String teacherEmail;

    private String qualification;
    private String specialization;
    private String department;
    private String experience;
    private String office;
    private String officePhoneNumber;
    private User.Role role;
    private String message;
}
