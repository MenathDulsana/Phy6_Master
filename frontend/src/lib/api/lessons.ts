import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, put, del } from "@/lib/api-client";
import type { Lesson } from "./types";

export function useLessons(courseId: number | undefined) {
  return useQuery<Lesson[]>({
    queryKey: ["lessons", courseId],
    queryFn: () => get<Lesson[]>(`/api/lessons/courses/${courseId}`),
    enabled: !!courseId,
  });
}

export function useCreateLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, ...lesson }: { courseId: number; title: string; content?: string; month?: string }) =>
      post<Lesson>(`/api/lessons/courses/${courseId}`, lesson),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lessons"] }),
  });
}

export function useUpdateLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; title: string; content?: string; month?: string }) =>
      put<Lesson>(`/api/lessons/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lessons"] }),
  });
}

export function useDeleteLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => del(`/api/lessons/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lessons"] }),
  });
}
