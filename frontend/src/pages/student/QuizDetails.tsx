import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ClipboardCheck, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useActiveQuizSession,
  useQuizDetails,
  useStartQuizSession,
  useStudentQuizAttempts,
} from "@/lib/api";

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

const formatDuration = (seconds?: number) => {
  if (!seconds && seconds !== 0) return "-";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins <= 0) {
    return `${secs} secs`;
  }
  if (secs === 0) {
    return `${mins} mins`;
  }
  return `${mins} mins ${secs} secs`;
};

export default function QuizDetails() {
  const navigate = useNavigate();
  const { quizId: quizIdParam } = useParams();
  const rawQuizId = quizIdParam ? Number(quizIdParam) : undefined;
  const quizId = Number.isFinite(rawQuizId) ? rawQuizId : undefined;
  const studentId = Number(localStorage.getItem("authUserId")) || undefined;

  const { data: quiz } = useQuizDetails(quizId, studentId);
  const { data: activeSession } = useActiveQuizSession(studentId, quizId);
  const { data: attempts = [] } = useStudentQuizAttempts(studentId, quizId);
  const startSession = useStartQuizSession();

  useEffect(() => {
    if (!quizId) {
      navigate("/student/quizzes");
    }
  }, [navigate, quizId]);

  const canResume = activeSession?.status === "ACTIVE" && !!activeSession?.hasAnswers;
  const hasAttempts = attempts.length > 0;
  const actionLabel = canResume ? "Resume quiz" : hasAttempts ? "Re-attempt quiz" : "Start quiz";

  const openedText = useMemo(() => {
    if (!quiz?.createdAt) return "-";
    return new Date(quiz.createdAt).toLocaleString();
  }, [quiz?.createdAt]);

  const handlePrimaryAction = () => {
    if (!studentId || !quizId) return;
    if (canResume) {
      navigate(`/student/quizzes/${quizId}/play`);
      return;
    }
    startSession.mutate(
      { studentId, quizId },
      {
        onSuccess: () => {
          navigate(`/student/quizzes/${quizId}/play`);
        },
        onError: (err: any) => {
          if (err?.status === 403) {
            toast.error("You are not enrolled in this class.");
            navigate("/student/quizzes");
            return;
          }
          toast.error(err?.message || "Could not start quiz.");
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <motion.div {...fadeIn} className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <ClipboardCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">{quiz?.title ?? "Quiz"}</h1>
            <p className="text-sm text-muted-foreground">Opened: {openedText}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Grading method: Highest grade</p>
      </motion.div>

      <motion.div {...fadeIn} transition={{ delay: 0.05 }}>
        <Card className="shadow-card">
          <CardContent className="py-6 flex items-center justify-center">
            <Button
              className="gradient-cta text-primary-foreground"
              onClick={handlePrimaryAction}
              disabled={startSession.isPending}
            >
              {hasAttempts && !canResume && <RotateCcw className="h-4 w-4 mr-2" />}
              {actionLabel}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Your attempts</CardTitle>
          </CardHeader>
          <CardContent>
            {attempts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No attempts yet.</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {attempts.map((attempt) => (
                  <div key={attempt.attemptNumber} className="rounded-lg border border-border bg-secondary/30">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                      <p className="font-medium text-foreground">Attempt {attempt.attemptNumber}</p>
                      <Badge variant={attempt.status === "PASS" ? "default" : "secondary"}>
                        {attempt.status}
                      </Badge>
                    </div>
                    <div className="p-4 space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Started</span>
                        <span>{attempt.startedAt ? new Date(attempt.startedAt).toLocaleString() : "-"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Completed</span>
                        <span>{attempt.completedAt ? new Date(attempt.completedAt).toLocaleString() : "-"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Duration</span>
                        <span>{formatDuration(attempt.durationSeconds)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Score</span>
                        <span className="font-semibold">
                          {Math.round(attempt.scorePercentage)}% ({attempt.correctAnswers}/{attempt.totalQuestions})
                        </span>
                      </div>
                    </div>
                    <div className="px-4 pb-4 text-xs text-muted-foreground">
                      Review not permitted
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
