import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api-client";
import type { Teacher } from "./types";

export function useTeacherProfile(userId: number | undefined) {
  return useQuery<Teacher>({
    queryKey: ["teacher-profile", userId],
    queryFn: () => get<Teacher>(`/api/teachers/profile/${userId}`),
    enabled: !!userId,
  });
}

export function useAllTeachers() {
  return useQuery<Teacher[]>({
    queryKey: ["teachers"],
    queryFn: () => get<Teacher[]>("/api/teachers/all"),
  });
}
