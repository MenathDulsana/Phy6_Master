package com.example.Phy6_Master.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TutorPerformanceDTO {
    private Long tutorId;
    private String tutorName;
    private Integer completedSessions;
    private Integer acceptedRequests;
    private Double averageRating;
}
