import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, put, del } from "@/lib/api-client";
import type { Course } from "./types";

export function useCourses() {
  return useQuery<Course[]>({
    queryKey: ["courses"],
    queryFn: () => get<Course[]>("/api/courses"),
  });
}

export function useCourse(id: number | undefined) {
  return useQuery<Course>({
    queryKey: ["courses", id],
    queryFn: () => get<Course>(`/api/courses/${id}`),
    enabled: !!id,
  });
}

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (course: Partial<Course> & { teacherId?: number }) => post<Course>("/api/courses", course),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["courses"] }),
  });
}

export function useUpdateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Course> & { id: number }) =>
      put<Course>(`/api/courses/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["courses"] }),
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => del(`/api/courses/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["courses"] }),
  });
}

export function useEnrollmentCount(courseId: number | undefined) {
  return useQuery<number>({
    queryKey: ["enrollment-count", courseId],
    queryFn: () => get<number>(`/api/courses/${courseId}/enrollment-count`),
    enabled: !!courseId,
  });
}
