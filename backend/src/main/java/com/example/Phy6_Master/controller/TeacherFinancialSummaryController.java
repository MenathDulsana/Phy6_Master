package com.example.Phy6_Master.controller;

import com.example.Phy6_Master.dto.TeacherFinancialSummaryResponseDTO;
import com.example.Phy6_Master.service.TeacherFinancialSummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/teacher/financial-summaries")
@RequiredArgsConstructor
public class TeacherFinancialSummaryController {

    private final TeacherFinancialSummaryService teacherFinancialSummaryService;

    @GetMapping("/latest")
    public ResponseEntity<TeacherFinancialSummaryResponseDTO> getLatestSummary() {
        return ResponseEntity.ok(teacherFinancialSummaryService.getLatestSummary());
    }

    @GetMapping
    public ResponseEntity<TeacherFinancialSummaryResponseDTO> getSummaryByMonthAndYear(
            @RequestParam int month,
            @RequestParam int year) {
        try {
            return ResponseEntity.ok(teacherFinancialSummaryService.getSummaryForMonth(month, year));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
