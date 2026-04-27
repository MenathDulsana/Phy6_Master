package com.example.Phy6_Master.dto;

import com.example.Phy6_Master.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AccountantResponse {
    private Long userId;
    private Long accountantId;
    private String username;
    private String name;
    private String email;
    private String phoneNumber;
    private String department;
    private String qualification;
    private String designation;
    private String officeLocation;
    private User.Role role;
    private String message;
}
