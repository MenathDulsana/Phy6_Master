package com.example.Phy6_Master.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PendingEnrollmentResponseDTO {
    private Long courseId;
    private String courseName;
    private String status;
    private String message;
}
