package com.example.Phy6_Master.dto;

import com.example.Phy6_Master.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private Long userId;
    private String username;
    private String name;
    private User.Role role;
    private String message;
}
