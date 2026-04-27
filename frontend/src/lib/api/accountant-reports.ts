import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api-client";

export type MonthlyFinancialReportResponseDTO = {
    month: number;
    year: number;
    courseId: number | null;
    courseName: string | null;
    paymentMethod: string | null;
    totalFeesCollected: number;
    pendingPaymentsCount: number;
    rejectedPaymentsCount: number;
    approvedPaymentsCount: number;
    totalPaymentsCount: number;
    enrollmentCount: number;
    reportGeneratedAt: string;
    message: string;
};

export function useMonthlyFinancialReport(
    month: number, 
    year: number, 
    courseId?: number, 
    paymentMethod?: string, 
    enabled: boolean = true
) {
    const params = new URLSearchParams();
    params.append("month", month.toString());
    params.append("year", year.toString());
    if (courseId) params.append("courseId", courseId.toString());
    if (paymentMethod) params.append("paymentMethod", paymentMethod);

    return useQuery<MonthlyFinancialReportResponseDTO>({
        queryKey: ["accountant-monthly-report", month, year, courseId, paymentMethod],
        queryFn: () => get<MonthlyFinancialReportResponseDTO>(`/api/accountant/reports/financial?${params.toString()}`),
        enabled: enabled,
    });
}
