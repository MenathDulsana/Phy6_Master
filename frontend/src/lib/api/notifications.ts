import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, patch } from "@/lib/api-client";

export type PaymentNotification = {
    id: number;
    paymentId?: number | null;
    receiptNumber?: string | null;
    title: string;
    message: string;
    classReference: string;
    type: "APPROVED" | "REJECTED" | "RECEIPT" | "INFO";
    isRead: boolean;
    createdAt: string;
};

export function useStudentNotifications(studentId: number | undefined) {
    return useQuery<PaymentNotification[]>({
        queryKey: ["student-notifications", studentId],
        queryFn: () => get<PaymentNotification[]>(`/api/student/notifications/${studentId}`),
        enabled: !!studentId,
    });
}

export function useMarkNotificationAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, studentId }: { id: number; studentId: number }) => {
            return patch<{ success: boolean; message: string }>(
                `/api/student/notifications/${id}/read?studentId=${studentId}`
            );
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["student-notifications", variables.studentId] });
        },
    });
}
