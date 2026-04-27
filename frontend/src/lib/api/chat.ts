import { useMutation } from "@tanstack/react-query";
import { post } from "@/lib/api-client";

export type ChatResponse = {
  response: string;
};

export function useChatbotResponse() {
  return useMutation({
    mutationFn: (message: string) =>
      post<ChatResponse>("/api/chat", { message }),
  });
}
