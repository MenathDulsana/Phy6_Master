import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { del, get, post, put } from "@/lib/api-client";
import type { QuizSummary } from "./types";

export type QuizStatus = "DRAFT" | "PUBLISHED";

export interface QuizOptionInput {
  text: string;
  correct: boolean;
}

export interface QuizQuestionInput {
  text: string;
  options: QuizOptionInput[];
}

export interface CreateTeacherQuizInput {
  teacherId: number;
  title: string;
  courseId: number;
  status: QuizStatus;
  questions: QuizQuestionInput[];
}

export function useTeacherQuizzes(teacherId: number | undefined) {
  return useQuery<QuizSummary[]>({
    queryKey: ["teacher-quizzes", teacherId],
    queryFn: () => get<QuizSummary[]>(`/api/teachers/${teacherId}/quizzes`),
    enabled: !!teacherId,
  });
}

export function useCreateTeacherQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTeacherQuizInput) => post<QuizSummary>("/api/quizzes", payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["teacher-quizzes", variables.teacherId] });
    },
  });
}

export function useUpdateTeacherQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: CreateTeacherQuizInput & { id: number }) =>
      put<QuizSummary>(`/api/quizzes/${id}`, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["teacher-quizzes", variables.teacherId] });
    },
  });
}

export function useDeleteTeacherQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, teacherId }: { id: number; teacherId: number }) =>
      del(`/api/quizzes/${id}?teacherId=${teacherId}`),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["teacher-quizzes", variables.teacherId] });
    },
  });
}
