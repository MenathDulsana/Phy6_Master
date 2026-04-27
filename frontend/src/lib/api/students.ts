import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, put, post } from "@/lib/api-client";
import type { Student, Course, User, QuizAttempt, QuizResultSummary, StudentDashboardResponse } from "./types";

export type EnrollmentSummary = {
  id: number;
  courseId: number;
  courseName: string;
  status: string;
  message?: string;
  enrollmentDate?: string;
};

export type StudentProfileUpdateRequest = {
  email?: string;
  phoneNumber?: string;
  address?: string;
  school?: string;
  stream?: string;
  batch?: string;
  newPassword?: string;
};

export type StudentProfileResponse = {
  userId: number;
  studentId: number;
  username: string;
  name: string;
  email: string;
  phoneNumber: string;
  enrollmentNumber?: string;
  school?: string;
  batch?: string;
  stream?: string;
  address?: string;
  parentName?: string;
  parentPhoneNumber?: string;
  role: User["role"];
  message: string;
};

export function useAllStudents() {
  return useQuery<Student[]>({
    queryKey: ["students"],
    queryFn: () => get<Student[]>("/api/students/all"),
  });
}

/** Get the Student entity for the currently logged-in user (by User ID). */
export function useStudentByUser(userId: number | undefined) {
  return useQuery<Student>({
    queryKey: ["student-by-user", userId],
    queryFn: () => get<Student>(`/api/students/by-user/${userId}`),
    enabled: !!userId,
  });
}

/** Get enrolled courses for a student identified by their User ID. */
export function useStudentCourses(userId: number | undefined) {
  return useQuery<Course[]>({
    queryKey: ["student-courses", userId],
    queryFn: () => get<Course[]>(`/api/students/by-user/${userId}/courses`),
    enabled: !!userId,
  });
}

export function useUpdateStudentProfile(userId: number | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StudentProfileUpdateRequest) =>
      put<StudentProfileResponse>(`/api/students/by-user/${userId}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student-by-user", userId] });
      qc.invalidateQueries({ queryKey: ["user", userId] });
    },
  });
}

export function usePendingEnrollments(userId?: number) {
  return useQuery<EnrollmentSummary[]>({
    queryKey: ["pending-enrollments", userId],
    queryFn: () => get<EnrollmentSummary[]>(`/api/student/enrollments/pending/${userId}`),
    enabled: !!userId,
  });
}

export function useClassAccess(userId?: number, courseId?: number) {
  return useQuery({
    queryKey: ["class-access", userId, courseId],
    queryFn: () => get<{canAccess: boolean; status: string; message: string}>(`/api/student/enrollments/access/${userId}/${courseId}`),
    enabled: !!userId && !!courseId,
  });
}

export function useAllEnrollments(userId?: number) {
  return useQuery<EnrollmentSummary[]>({
    queryKey: ["all-enrollments", userId],
    queryFn: () => get<EnrollmentSummary[]>(`/api/student/enrollments/status/${userId}`),
    enabled: !!userId,
    // Poll every 10 seconds so the student automatically sees the updated
    // enrollment status (e.g. PAYMENT_SUBMITTED → ACTIVE) without a manual reload.
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });
}

export function useStudentQuizResults(userId?: number) {
  return useQuery<QuizResultSummary[]>({
    queryKey: ["student-quiz-results", userId],
    queryFn: () => get<QuizResultSummary[]>(`/api/students/${userId}/quiz-results/latest`),
    enabled: !!userId,
  });
}

export function useStudentDashboard(userId?: number) {
  return useQuery<StudentDashboardResponse>({
    queryKey: ["student-dashboard", userId],
    queryFn: () => get<StudentDashboardResponse>(`/api/students/${userId}/dashboard`),
    enabled: !!userId,
  });
}

export type WithdrawPaymentRequest = {
  studentId?: number;
  courseId?: number;
  stripeSessionId?: string;
};

export function useWithdrawPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: WithdrawPaymentRequest) =>
      post<{ success: boolean; message: string }>("/api/student/payments/withdraw", payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["all-enrollments"] });
      qc.invalidateQueries({ queryKey: ["pending-enrollments"] });
      if (vars.studentId) {
        qc.invalidateQueries({ queryKey: ["student-payment-history", vars.studentId] });
      }
    },
  });
}

export function useStudentQuizAttempts(userId?: number, quizId?: number) {
  return useQuery<QuizAttempt[]>({
    queryKey: ["student-quiz-attempts", userId, quizId],
    queryFn: () => get<QuizAttempt[]>(`/api/students/${userId}/quiz-results/${quizId}`),
    enabled: !!userId && !!quizId,
  });
}

export type PaymentHistoryResponseDTO = {
    id: number;
    courseId: number;
    courseName: string;
    amount: number;
    paymentMethod: string;
    status: string;
    submittedAt: string;
    verifiedAt: string;
    rejectionReason: string;
};

/** Student receipt PDF (approved payment + receipt issued; {@code userId} = auth user id). */
export function studentReceiptDownloadUrl(paymentId: number, userId: number): string {
    return `/api/student/payments/${paymentId}/receipt/download?userId=${userId}`;
}

export async function downloadStudentReceiptPdf(paymentId: number, userId: number): Promise<void> {
    const url = studentReceiptDownloadUrl(paymentId, userId);
    const res = await fetch(url);
    const contentType = res.headers.get("content-type") ?? "";
    if (!res.ok) {
        if (contentType.includes("application/json")) {
            const body = (await res.json().catch(() => ({}))) as { message?: string };
            throw new Error(body.message || `Could not download receipt (${res.status})`);
        }
        throw new Error(`Could not download receipt (${res.status})`);
    }
    const blob = await res.blob();
    const dispo = res.headers.get("content-disposition");
    let filename = "phy6-receipt.pdf";
    const quoted = dispo?.match(/filename="([^"]+)"/i);
    const unquoted = dispo?.match(/filename=([^;\s]+)/i);
    if (quoted?.[1]) filename = quoted[1].trim();
    else if (unquoted?.[1]) filename = unquoted[1].replace(/^UTF-8''/i, "").trim();
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
}

export function usePaymentHistory(studentId?: number) {
    return useQuery<PaymentHistoryResponseDTO[]>({
        queryKey: ["student-payment-history", studentId],
        queryFn: () => get<PaymentHistoryResponseDTO[]>(`/api/student/payments/history/${studentId}`),
        enabled: !!studentId,
    });
}
