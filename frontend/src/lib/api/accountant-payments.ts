import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, post } from "@/lib/api-client";

export type PaymentPendingListResponseDTO = {
    id: number;
    studentName: string;
    courseName: string;
    paymentMethod: string;
    submissionDate: string;
    status: string;
};

export type PaymentDetailResponseDTO = {
    id: number;
    studentName: string;
    studentEmail: string | null;
    courseName: string;
    amount: number;
    paymentMethod: string;
    referenceNumber: string | null;
    submissionDate: string;
    proofFilePath: string | null;
    hasProof: boolean;
    status: string;
    rejectionReason: string | null;
    receiptNumber: string | null;
};

export type ReceiptResponseDTO = {
    paymentId: number;
    receiptNumber: string;
    studentName: string;
    courseName: string;
    amount: number;
    paymentMethod: string;
    approvalDate: string;
    generatedAt: string;
    receiptDownloadUrl: string;
};

export function usePendingPayments() {
    return useQuery<PaymentPendingListResponseDTO[]>({
        queryKey: ["accountant-pending-payments"],
        queryFn: () => get<PaymentPendingListResponseDTO[]>("/api/accountant/payments/pending"),
    });
}

export function usePaymentDetail(paymentId: string | undefined) {
    return useQuery<PaymentDetailResponseDTO>({
        queryKey: ["accountant-payment-detail", paymentId],
        queryFn: () => get<PaymentDetailResponseDTO>(`/api/accountant/payments/${paymentId}`),
        enabled: !!paymentId,
    });
}

export function useApprovePayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (paymentId: number) => {
            // simulate accountant user currently logged in
            const accountantId = localStorage.getItem("authUserId") || "";
            const pathSuffix = accountantId ? `?accountantId=${accountantId}` : "";
            return post<{ success: boolean; message: string }>(
                `/api/accountant/payments/${paymentId}/approve${pathSuffix}`,
                {}
            );
        },
        onSuccess: (_, paymentId) => {
            queryClient.invalidateQueries({ queryKey: ["accountant-pending-payments"] });
            queryClient.invalidateQueries({ queryKey: ["accountant-payment-detail", paymentId.toString()] });
            queryClient.invalidateQueries({ queryKey: ["accountant-payment-history"] });
        },
    });
}

export function useRejectPayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ paymentId, reason }: { paymentId: number; reason: string }) => {
            const accountantId = localStorage.getItem("authUserId") || "";
            const pathSuffix = accountantId ? `?accountantId=${accountantId}` : "";
            return post<{ success: boolean; message: string }>(
                `/api/accountant/payments/${paymentId}/reject${pathSuffix}`,
                { rejectionReason: reason }
            );
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["accountant-pending-payments"] });
            queryClient.invalidateQueries({ queryKey: ["accountant-payment-detail", variables.paymentId.toString()] });
        },
    });
}

export type AccountantPaymentHistoryResponseDTO = {
    id: number;
    studentId: number | null;
    studentName: string;
    courseId: number | null;
    courseName: string;
    amount: number;
    paymentMethod: string;
    referenceNumber: string | null;
    status: string;
    verifiedBy: string | null;
    submittedAt: string;
    verifiedAt: string | null;
    rejectionReason: string | null;
    receiptNumber: string | null;
}

export function useAccountantPaymentHistory() {
    return useQuery<AccountantPaymentHistoryResponseDTO[]>({
        queryKey: ["accountant-payment-history"],
        queryFn: () => get<AccountantPaymentHistoryResponseDTO[]>("/api/accountant/payments/history"),
    });
}

export function useSearchPayments(status?: string, keyword?: string) {
    return useQuery<AccountantPaymentHistoryResponseDTO[]>({
        queryKey: ["accountant-search-payments", status, keyword],
        queryFn: () => {
            const params = new URLSearchParams();
            if (status) params.append("status", status);
            if (keyword) params.append("studentName", keyword);
            return get<AccountantPaymentHistoryResponseDTO[]>(`/api/accountant/payments/history?${params.toString()}`);
        },
    });
}

export function useGenerateReceipt() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (paymentId: number) => {
            return post<ReceiptResponseDTO>(`/api/accountant/payments/${paymentId}/receipt`, {});
        },
        onSuccess: (_, paymentId) => {
            queryClient.invalidateQueries({ queryKey: ["accountant-payment-detail", paymentId.toString()] });
            queryClient.invalidateQueries({ queryKey: ["accountant-payment-history"] });
        },
    });
}
