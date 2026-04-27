import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useChatbotResponse } from "@/lib/api";

type ChatMessage = {
  id: number;
  role: "assistant" | "user";
  content: string;
};

const DEFAULT_ASSISTANT_MESSAGE: ChatMessage = {
  id: Date.now(),
  role: "assistant",
  content: "Hi! I'm your Phy6 Master AI assistant. Ask me anything about your studies.",
};

export default function Chatbot() {
  const userId = localStorage.getItem("authUserId") ?? "guest";
  const chatHistoryKey = `student-chat-history:${userId}`;
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const rawHistory = localStorage.getItem(chatHistoryKey);
      if (!rawHistory) return [DEFAULT_ASSISTANT_MESSAGE];

      const parsed = JSON.parse(rawHistory) as ChatMessage[];
      if (!Array.isArray(parsed) || parsed.length === 0) return [DEFAULT_ASSISTANT_MESSAGE];
      return parsed;
    } catch {
      return [DEFAULT_ASSISTANT_MESSAGE];
    }
  });

  const { mutateAsync: askChatbot, isPending } = useChatbotResponse();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    localStorage.setItem(chatHistoryKey, JSON.stringify(messages));
  }, [chatHistoryKey, messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isPending) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const reply = await askChatbot(text);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: reply.response,
        },
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to get chatbot response";
      toast.error(errorMessage);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: "I couldn't respond right now. Please try again in a moment.",
        },
      ]);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage();
  };

  const clearHistory = () => {
    const resetMessages = [{ ...DEFAULT_ASSISTANT_MESSAGE, id: Date.now() }];
    setMessages(resetMessages);
    localStorage.setItem(chatHistoryKey, JSON.stringify(resetMessages));
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-9rem)] w-full max-w-5xl flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-display font-bold text-foreground">
            <Bot className="h-7 w-7 text-primary" />
            AI Chatbot
          </h1>
          <p className="mt-1 text-muted-foreground">
            Ask questions and get quick help for your learning.
          </p>
        </div>
        <Button type="button" variant="outline" className="gap-2" onClick={clearHistory}>
          <Trash2 className="h-4 w-4" />
          Clear history
        </Button>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col border-border shadow-card">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-base">Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col gap-4 pt-4">
          <ScrollArea className="min-h-0 flex-1 rounded-md border border-border bg-background p-4">
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-1 text-xs opacity-80">
                      {message.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                      {message.role === "user" ? "You" : "AI Assistant"}
                    </div>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}

              {isPending && (
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          <form className="flex gap-2" onSubmit={handleSubmit}>
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type your question..."
              className="min-h-12 resize-none"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
            />
            <Button type="submit" className="gap-2" disabled={isPending || !input.trim()}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
