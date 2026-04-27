package com.example.Phy6_Master.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecentTutorRequestDTO {
    private Long id;
    private LocalDateTime date;
    private String studentName;
    private String studentId;
    private String courseName;
    private String revision;
    private String paymentStatus;
}
