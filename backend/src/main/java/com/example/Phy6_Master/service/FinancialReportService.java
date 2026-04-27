package com.example.Phy6_Master.service;

import com.example.Phy6_Master.dto.MonthlyFinancialReportResponseDTO;
import com.example.Phy6_Master.model.Course;
import com.example.Phy6_Master.repository.CourseRepository;
import com.example.Phy6_Master.repository.EnrollmentRepository;
import com.example.Phy6_Master.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.YearMonth;

@Service
@RequiredArgsConstructor
public class FinancialReportService {

    private final PaymentRepository paymentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;

    public MonthlyFinancialReportResponseDTO generateMonthlyReport(int month, int year, Long courseId, String paymentMethod) {
        if (month < 1 || month > 12 || year < 2000 || year > 2100) {
            throw new IllegalArgumentException("Invalid month or year provided.");
        }

        // Calculate boundary dates
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDateTime startDate = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime endDate = yearMonth.atEndOfMonth().atTime(23, 59, 59, 999999999);

        // Optional Course Name mapping and Safe Fallbacks for JPQL
        String courseName = null;
        Long safeCourseId = -1L;
        if (courseId != null) {
            safeCourseId = courseId;
            courseName = courseRepository.findById(courseId)
                    .map(Course::getTitle)
                    .orElse("Unknown Course");
        }

        String safePaymentMethod = (paymentMethod == null || paymentMethod.isEmpty()) ? "ALL" : paymentMethod;

        // Fetch Filtered Metrics safely bypassing JPQL Null exceptions
        Double totalFeesCollected = paymentRepository.sumApprovedAmountWithFilters(startDate, endDate, safeCourseId, safePaymentMethod);
        long pendingCount = paymentRepository.countByStatusWithFilters("SUBMITTED", startDate, endDate, safeCourseId, safePaymentMethod);
        long rejectedCount = paymentRepository.countByStatusWithFilters("REJECTED", startDate, endDate, safeCourseId, safePaymentMethod);
        long approvedCount = paymentRepository.countByStatusWithFilters("APPROVED", startDate, endDate, safeCourseId, safePaymentMethod);
        long totalPaymentsCount = paymentRepository.countTotalWithFilters(startDate, endDate, safeCourseId, safePaymentMethod);
        long enrollmentCount = enrollmentRepository.countByEnrollmentDateWithFilters(startDate, endDate, safeCourseId);

        // Build Response
        String message = totalPaymentsCount == 0 && enrollmentCount == 0 
                ? "No financial data matches the selected filters." 
                : "Report generated successfully.";

        return MonthlyFinancialReportResponseDTO.builder()
                .month(month)
                .year(year)
                .courseId(courseId)
                .courseName(courseName)
                .paymentMethod(paymentMethod)
                .totalFeesCollected(totalFeesCollected)
                .pendingPaymentsCount(pendingCount)
                .rejectedPaymentsCount(rejectedCount)
                .approvedPaymentsCount(approvedCount)
                .totalPaymentsCount(totalPaymentsCount)
                .enrollmentCount(enrollmentCount)
                .reportGeneratedAt(LocalDateTime.now())
                .message(message)
                .build();
    }
}
