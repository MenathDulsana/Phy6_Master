import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, post } from "@/lib/api-client";

export type TutorIncomingRequest = {
  id: number;
  studentId: number;
  studentCode?: string;
  studentName: string;
  courseName: string;
  description: string;
  paymentStatus?: string;
  requestedDate?: string;
  createdAt?: string;
};

export type TutorProfile = {
  id: number;
  userId?: number;
  tutorId?: string;
  specialization?: string;
  qualification?: string;
  experience?: string;
  hourlyRate?: number;
  bio?: string;
};

export type TutorDashboardStats = {
  incomingRequests: number;
  activeRequests: number;
  delivered: number;
  totalSessions: number;
};

export type SpringPage<T> = {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};

export function useIncomingTutorRequests(page = 0, size = 20) {
  return useQuery<SpringPage<TutorIncomingRequest>>({
    queryKey: ["tutor-incoming-requests", page, size],
    queryFn: () =>
      get<SpringPage<TutorIncomingRequest>>(
        `/api/tutor-management/requests/incoming?page=${page}&size=${size}`,
      ),
  });
}

export function useTutorProfile(userId: number | undefined) {
  return useQuery<TutorProfile>({
    queryKey: ["tutor-profile", userId],
    queryFn: () => get<TutorProfile>(`/api/tutors/profile/${userId}`),
    enabled: !!userId,
  });
}

export function useTutorDashboardStats() {
  return useQuery<TutorDashboardStats>({
    queryKey: ["tutor-dashboard-stats"],
    queryFn: () => get<TutorDashboardStats>("/api/tutor-management/dashboard/stats"),
  });
}

export function useAcceptIncomingTutorRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, tutorId }: { requestId: number; tutorId: number }) =>
      post<TutorActiveRequest>(
        `/api/tutor-management/requests/${requestId}/accept?tutorId=${tutorId}`,
        {},
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutor-incoming-requests"] });
      queryClient.invalidateQueries({ queryKey: ["tutor-active-requests"] });
      queryClient.invalidateQueries({ queryKey: ["tutor-delivery-records"] });
      queryClient.invalidateQueries({ queryKey: ["tutor-declined-records"] });
      queryClient.invalidateQueries({ queryKey: ["tutor-dashboard-stats"] });
    },
  });
}

export function useDeclineIncomingTutorRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, reason }: { requestId: number; reason: string }) =>
      post<TutorIncomingRequest>(
        `/api/tutor-management/requests/${requestId}/reject?reason=${encodeURIComponent(reason)}`,
        {},
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutor-incoming-requests"] });
      queryClient.invalidateQueries({ queryKey: ["tutor-active-requests"] });
      queryClient.invalidateQueries({ queryKey: ["tutor-delivery-records"] });
      queryClient.invalidateQueries({ queryKey: ["tutor-declined-records"] });
      queryClient.invalidateQueries({ queryKey: ["tutor-dashboard-stats"] });
    },
  });
}

export type TutorActiveRequest = {
  id: number;
  studentId: number;
  studentCode?: string;
  studentName: string;
  courseName: string;
  description: string;
  status: string;
  requestedDate?: string;
  createdAt?: string;
};

export function useActiveTutorRequests(tutorId?: number, page = 0, size = 20) {
  return useQuery<SpringPage<TutorActiveRequest>>({
    queryKey: ["tutor-active-requests", tutorId, page, size],
    queryFn: () => {
      const query =
        tutorId !== undefined
          ? `?tutorId=${tutorId}&page=${page}&size=${size}`
          : `?page=${page}&size=${size}`;
      return get<SpringPage<TutorActiveRequest>>(`/api/tutor-management/requests/active${query}`);
    },
    enabled: tutorId !== undefined,
  });
}

export type TutorDeliveryRecord = {
  id: number;
  studentId: number;
  studentCode?: string;
  studentName: string;
  courseName: string;
  description: string;
  status: string;
  completedDate?: string;
  createdAt?: string;
};

export function useTutorDeliveryRecords(page = 0, size = 20) {
  return useQuery<SpringPage<TutorDeliveryRecord>>({
    queryKey: ["tutor-delivery-records", page, size],
    queryFn: () =>
      get<SpringPage<TutorDeliveryRecord>>(
        `/api/tutor-management/records/delivery?page=${page}&size=${size}`,
      ),
  });
}

export type TutorDeclinedRecord = {
  id: number;
  studentId: number;
  studentCode?: string;
  studentName: string;
  courseName: string;
  description: string;
  status: string;
  requestedDate?: string;
  createdAt?: string;
  notes?: string;
  paymentStatus?: string;
};

export function useTutorDeclinedRequests(page = 0, size = 20) {
  return useQuery<SpringPage<TutorDeclinedRecord>>({
    queryKey: ["tutor-declined-records", page, size],
    queryFn: () =>
      get<SpringPage<TutorDeclinedRecord>>(
        `/api/tutor-management/records/declined?page=${page}&size=${size}`,
      ),
  });
}

export function useMarkTutorRequestDelivered() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: number) =>
      post<TutorActiveRequest>(`/api/tutor-management/requests/${requestId}/deliver`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutor-active-requests"] });
      queryClient.invalidateQueries({ queryKey: ["tutor-incoming-requests"] });
      queryClient.invalidateQueries({ queryKey: ["tutor-delivery-records"] });
      queryClient.invalidateQueries({ queryKey: ["tutor-declined-records"] });
      queryClient.invalidateQueries({ queryKey: ["tutor-dashboard-stats"] });
    },
  });
}

export function useDeclineActiveTutorRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: number) =>
      post<TutorActiveRequest>(
        `/api/tutor-management/requests/${requestId}/cancel?reason=${encodeURIComponent("Declined by manager")}`,
        {},
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutor-active-requests"] });
      queryClient.invalidateQueries({ queryKey: ["tutor-incoming-requests"] });
      queryClient.invalidateQueries({ queryKey: ["tutor-delivery-records"] });
      queryClient.invalidateQueries({ queryKey: ["tutor-declined-records"] });
      queryClient.invalidateQueries({ queryKey: ["tutor-dashboard-stats"] });
    },
  });
}
