import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api-client";

export type TeacherFinancialSummaryResponseDTO = {
    month: number;
    year: number;
    totalFeesCollected: number | null;
    pendingPaymentsCount: number;
    rejectedPaymentsCount: number;
    approvedPaymentsCount: number;
    totalPaymentsCount: number;
    enrollmentCount: number;
    generatedAt: string;
    readOnly: boolean;
    message: string;
};

export function useLatestTeacherFinancialSummary(enabled: boolean = true) {
    return useQuery<TeacherFinancialSummaryResponseDTO>({
        queryKey: ["teacher-financial-monthly-latest"],
        queryFn: () => get<TeacherFinancialSummaryResponseDTO>(`/api/teacher/financial-summaries/latest`),
        enabled: enabled,
    });
}

export function useTeacherFinancialSummary(month: number, year: number, enabled: boolean = true) {
    return useQuery<TeacherFinancialSummaryResponseDTO>({
        queryKey: ["teacher-financial-monthly", month, year],
        queryFn: () => get<TeacherFinancialSummaryResponseDTO>(`/api/teacher/financial-summaries?month=${month}&year=${year}`),
        enabled: enabled,
    });
}
