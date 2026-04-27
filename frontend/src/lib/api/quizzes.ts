import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api-client";
import type { QuizSummary } from "./types";

export function useQuizDetails(quizId: number | undefined, studentId: number | undefined) {
  return useQuery<QuizSummary>({
    queryKey: ["quiz-details", quizId, studentId],
    queryFn: () => get<QuizSummary>(`/api/quizzes/${quizId}?studentId=${studentId}`),
    enabled: !!quizId && !!studentId,
  });
}
