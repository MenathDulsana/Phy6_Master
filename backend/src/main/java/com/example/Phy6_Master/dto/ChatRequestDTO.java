package com.example.Phy6_Master.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChatRequestDTO {
    @NotBlank(message = "Message must not be empty")
    @Size(max = 4000, message = "Message is too long")
    private String message;
}
