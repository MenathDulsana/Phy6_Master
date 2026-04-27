package com.example.Phy6_Master.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EnrollmentStatusItemDTO {
    private Long id;
    private Long courseId;
    private String courseName;
    private String status;
    private LocalDateTime enrollmentDate;
    private String message;
}
