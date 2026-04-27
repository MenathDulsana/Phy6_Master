package com.example.Phy6_Master.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateTutorRequestDTO {
    @NotBlank(message = "Course name is required")
    private String courseName;

    @NotBlank(message = "Description is required")
    private String description;

    private LocalDateTime scheduledDate;
}
