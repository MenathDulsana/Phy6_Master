import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api-client";
import type { User } from "./types";

export function useUserProfile(userId: number | undefined) {
  return useQuery<User>({
    queryKey: ["user", userId],
    queryFn: () => get<User>(`/api/users/${userId}`),
    enabled: !!userId,
  });
}
