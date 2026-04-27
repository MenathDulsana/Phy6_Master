package com.example.Phy6_Master.service;

import com.example.Phy6_Master.dto.MonthlyFinancialReportResponseDTO;
import com.example.Phy6_Master.dto.TeacherFinancialSummaryResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class TeacherFinancialSummaryService {

    private final FinancialReportService financialReportService;

    public TeacherFinancialSummaryResponseDTO getSummaryForMonth(int month, int year) {
        // Teacher is strictly prevented from pushing drill-down filters (courses/methods)
        MonthlyFinancialReportResponseDTO baseReport = financialReportService.generateMonthlyReport(month, year, null, null);

        return TeacherFinancialSummaryResponseDTO.builder()
                .month(baseReport.getMonth())
                .year(baseReport.getYear())
                .totalFeesCollected(baseReport.getTotalFeesCollected())
                .pendingPaymentsCount(baseReport.getPendingPaymentsCount())
                .rejectedPaymentsCount(baseReport.getRejectedPaymentsCount())
                .approvedPaymentsCount(baseReport.getApprovedPaymentsCount())
                .totalPaymentsCount(baseReport.getTotalPaymentsCount())
                .enrollmentCount(baseReport.getEnrollmentCount())
                .generatedAt(baseReport.getReportGeneratedAt())
                .readOnly(true)
                .message(baseReport.getTotalPaymentsCount() == 0 && baseReport.getEnrollmentCount() == 0
                        ? "No financial summary is currently available."
                        : baseReport.getMessage())
                .build();
    }

    public TeacherFinancialSummaryResponseDTO getLatestSummary() {
        // Defines the latest available baseline organically mapped to current server calendar constraints
        LocalDate now = LocalDate.now();
        return getSummaryForMonth(now.getMonthValue(), now.getYear());
    }
}
