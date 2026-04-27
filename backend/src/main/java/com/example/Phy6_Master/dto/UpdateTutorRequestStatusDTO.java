package com.example.Phy6_Master.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTutorRequestStatusDTO {
    @NotBlank(message = "Status is required")
    private String status;

    private String notes;
}
