import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, del } from "@/lib/api-client";

/** Check if a user is enrolled in a specific course. */
export function useIsEnrolled(userId: number | undefined, courseId: number | undefined) {
  return useQuery<boolean>({
    queryKey: ["enrollment-check", userId, courseId],
    queryFn: () => get<boolean>(`/api/enrollments/check?userId=${userId}&courseId=${courseId}`),
    enabled: !!userId && !!courseId,
  });
}

/** Enroll the current user in a course. */
export function useEnrollStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, courseId }: { userId: number; courseId: number }) =>
      post(`/api/enrollments?userId=${userId}&courseId=${courseId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["enrollment-check"] });
      qc.invalidateQueries({ queryKey: ["student-courses"] });
      qc.invalidateQueries({ queryKey: ["all-enrollments"] });
    },
  });
}

/** Unenroll the current user from a course. */
export function useUnenrollStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, courseId }: { userId: number; courseId: number }) =>
      del(`/api/enrollments?userId=${userId}&courseId=${courseId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["enrollment-check"] });
      qc.invalidateQueries({ queryKey: ["student-courses"] });
      qc.invalidateQueries({ queryKey: ["all-enrollments"] });
    },
  });
}
