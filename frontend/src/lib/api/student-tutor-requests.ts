import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, post } from "@/lib/api-client";

export type StudentTutorRequest = {
  id: number;
  studentId: number;
  studentCode?: string;
  studentName?: string;
  assignedTutorId?: number;
  assignedTutorName?: string;
  courseName: string;
  description: string;
  paymentStatus?: string;
  status: string;
  requestedDate?: string;
  scheduledDate?: string;
  completedDate?: string;
  notes?: string;
  sessionDuration?: number;
  tutorNotes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateStudentTutorRequestInput = {
  courseName: string;
  description: string;
  scheduledDate?: string;
};

export type SpringPage<T> = {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};

export function useStudentTutorRequests(studentId: number | undefined, page = 0, size = 10) {
  return useQuery<SpringPage<StudentTutorRequest>>({
    queryKey: ["student-tutor-requests", studentId, page, size],
    queryFn: () =>
      get<SpringPage<StudentTutorRequest>>(
        `/api/student/tutor-requests?studentId=${studentId}&page=${page}&size=${size}`,
      ),
    enabled: !!studentId,
  });
}

export function useCreateStudentTutorRequest(studentId: number | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateStudentTutorRequestInput) =>
      post<StudentTutorRequest>(`/api/student/tutor-requests?studentId=${studentId}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-tutor-requests", studentId] });
    },
  });
}

export function useCancelStudentTutorRequest(studentId: number | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, reason }: { requestId: number; reason?: string }) =>
      post<StudentTutorRequest>(
        `/api/student/tutor-requests/${requestId}/cancel?studentId=${studentId}&reason=${encodeURIComponent(reason ?? "Cancelled by student")}`,
        {},
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-tutor-requests", studentId] });
    },
  });
}
