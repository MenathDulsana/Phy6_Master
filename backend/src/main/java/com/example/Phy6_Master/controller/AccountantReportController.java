package com.example.Phy6_Master.controller;

import com.example.Phy6_Master.dto.MonthlyFinancialReportResponseDTO;
import com.example.Phy6_Master.service.FinancialReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/accountant/reports")
@RequiredArgsConstructor
public class AccountantReportController {

    private final FinancialReportService financialReportService;

    @GetMapping({"/monthly", "/financial"})
    public ResponseEntity<MonthlyFinancialReportResponseDTO> getMonthlyReport(
            @RequestParam int month,
            @RequestParam int year,
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) String paymentMethod) {
        
        try {
            MonthlyFinancialReportResponseDTO report = financialReportService.generateMonthlyReport(month, year, courseId, paymentMethod);
            return ResponseEntity.ok(report);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
