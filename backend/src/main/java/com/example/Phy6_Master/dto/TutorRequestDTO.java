package com.example.Phy6_Master.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TutorRequestDTO {
    private Long id;
    private Long studentId;
    private String studentCode;
    private String studentName;
    private Long assignedTutorId;
    private String assignedTutorName;
    private String courseName;
    private String description;
    private String paymentStatus;
    private String status;
    private LocalDateTime requestedDate;
    private LocalDateTime scheduledDate;
    private LocalDateTime completedDate;
    private String notes;
    private Double sessionDuration;
    private String tutorNotes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
