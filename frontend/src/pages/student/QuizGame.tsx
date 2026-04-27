import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Flag, Trophy, ArrowLeft, ListChecks, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  useActiveQuizSession,
  useAnswerCurrentQuizQuestion,
  useCurrentQuizQuestion,
  useJumpToQuizQuestion,
  useMoveToPreviousQuizQuestion,
  useMoveToNextQuizQuestion,
  useQuizSessionReview,
  useQuizSessionResult,
  useQuizSessionSummary,
  useQuizSession,
  useStartQuizSession,
  useSubmitQuizSession,
} from "@/lib/api";

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

export default function QuizGame() {
  const navigate = useNavigate();
  const { quizId: quizIdParam } = useParams();
  const rawQuizId = quizIdParam ? Number(quizIdParam) : undefined;
  const quizId = Number.isFinite(rawQuizId) ? rawQuizId : undefined;
  const studentId = Number(localStorage.getItem("authUserId")) || undefined;

  const [sessionId, setSessionId] = useState<number | undefined>();
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [savedAnswers, setSavedAnswers] = useState<Record<number, number>>({});
  const [summaryOpen, setSummaryOpen] = useState(false);

  const {
    data: activeSession,
    isLoading: loadingActiveSession,
    error: activeSessionError,
  } = useActiveQuizSession(studentId, quizId);
  const { data: sessionInfo } = useQuizSession(sessionId, studentId);
  const {
    data: currentQuestion,
    isLoading: loadingQuestion,
    error: currentQuestionError,
  } = useCurrentQuizQuestion(sessionId, studentId);
  const { data: summary } = useQuizSessionSummary(sessionId, studentId);
  const { data: sessionResult } = useQuizSessionResult(
    sessionInfo?.status === "COMPLETED" ? sessionId : undefined,
    studentId
  );
  const { data: review } = useQuizSessionReview(sessionId, studentId, sessionInfo?.status === "COMPLETED");

  const startSession = useStartQuizSession();
  const answerQuestion = useAnswerCurrentQuizQuestion();
  const nextQuestion = useMoveToNextQuizQuestion();
  const previousQuestion = useMoveToPreviousQuizQuestion();
  const jumpQuestion = useJumpToQuizQuestion();
  const submitSession = useSubmitQuizSession();

  useEffect(() => {
    if (!quizId) {
      navigate("/student/quizzes");
    }
  }, [navigate, quizId]);

  useEffect(() => {
    if (activeSession?.id) {
      setSessionId(activeSession.id);
    }
  }, [activeSession]);

  useEffect(() => {
    if (!quizId || !studentId || loadingActiveSession || startSession.isPending) return;
    if (sessionInfo?.status === "COMPLETED") return;
    if (activeSession?.id) return;
    const status = (activeSessionError as any)?.status;
    if (status && status !== 404) return;
    if (status === 404) {
      startSession.mutate(
        { studentId, quizId },
        {
          onSuccess: (res) => {
            setSessionId(res.id);
            toast.success("Quiz session started.");
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
    }
  }, [
    activeSession,
    activeSessionError,
    loadingActiveSession,
    navigate,
    quizId,
    startSession,
    studentId,
    sessionInfo?.status,
  ]);

  useEffect(() => {
    if (!currentQuestion?.question?.id) return;
    const questionId = currentQuestion.question.id;
    const storedOptionId = currentQuestion.selectedOptionId ?? savedAnswers[questionId] ?? null;
    setSelectedOptionId(storedOptionId);
    if (
      currentQuestion.selectedOptionId !== undefined &&
      savedAnswers[questionId] !== currentQuestion.selectedOptionId
    ) {
      setSavedAnswers((prev) => ({ ...prev, [questionId]: currentQuestion.selectedOptionId }));
    }
  }, [currentQuestion, savedAnswers]);

  useEffect(() => {
    const status = (activeSessionError as any)?.status || (currentQuestionError as any)?.status;
    if (status === 403) {
      toast.error("You are not allowed to access this quiz.");
      navigate("/student/quizzes");
    }
  }, [activeSessionError, currentQuestionError, navigate]);

  const progressValue = useMemo(() => {
    if (!currentQuestion) return 0;
    return Math.round((currentQuestion.questionIndex / currentQuestion.totalQuestions) * 100);
  }, [currentQuestion]);
  const isLastQuestion = currentQuestion?.lastQuestion ?? currentQuestion?.isLastQuestion ?? false;
  const unansweredCount = useMemo(() => {
    const questions = summary?.questions ?? [];
    return questions.filter((q) => !q.answered).length;
  }, [summary]);

  const handleSelectOption = (optionId: number) => {
    setSelectedOptionId(optionId);
    if (!studentId || !sessionId || !currentQuestion?.question?.id) return;
    const questionId = currentQuestion.question.id;
    answerQuestion.mutate(
      { sessionId, studentId, selectedOptionId: optionId },
      {
        onSuccess: () => {
          setSavedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
        },
        onError: (err: any) => toast.error(err?.message || "Could not save answer."),
      }
    );
  };

  const handleNext = () => {
    if (!studentId || !sessionId || !currentQuestion?.question?.id) return;
    const questionId = currentQuestion.question.id;
    const proceed = () => {
      nextQuestion.mutate(
        { sessionId, studentId },
        {
          onError: (err: any) => toast.error(err?.message || "Could not move to next question."),
        }
      );
    };
    if (!selectedOptionId || savedAnswers[questionId] === selectedOptionId) {
      proceed();
      return;
    }
    answerQuestion.mutate(
      { sessionId, studentId, selectedOptionId },
      {
        onSuccess: () => {
          setSavedAnswers((prev) => ({ ...prev, [questionId]: selectedOptionId }));
          proceed();
        },
        onError: (err: any) => toast.error(err?.message || "Could not save answer."),
      }
    );
  };

  const handlePrevious = () => {
    if (!studentId || !sessionId) return;
    previousQuestion.mutate(
      { sessionId, studentId },
      {
        onError: (err: any) => toast.error(err?.message || "Could not move to previous question."),
      }
    );
  };

  const handleSubmitQuiz = () => {
    if (!studentId || !sessionId || !currentQuestion?.question?.id) return;
    const questionId = currentQuestion.question.id;
    const submit = () => {
      submitSession.mutate(
        { sessionId, studentId },
        {
          onSuccess: (res) => {
            toast.success(
              `Quiz submitted. Score: ${res.correctAnswersCount}/${res.totalQuestions} (${Math.round(res.scorePercentage)}%)`
            );
          },
          onError: (err: any) => toast.error(err?.message || "Could not submit quiz."),
        }
      );
    };
    if (!selectedOptionId || savedAnswers[questionId] === selectedOptionId) {
      submit();
      return;
    }
    answerQuestion.mutate(
      { sessionId, studentId, selectedOptionId },
      {
        onSuccess: () => {
          setSavedAnswers((prev) => ({ ...prev, [questionId]: selectedOptionId }));
          submit();
        },
        onError: (err: any) => toast.error(err?.message || "Could not save answer."),
      }
    );
  };

  return (
    <div className="space-y-6">
      <motion.div {...fadeIn} className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(quizId ? `/student/quizzes/${quizId}` : "/student/quizzes")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="font-display text-2xl font-bold text-foreground">Quiz</h1>
      </motion.div>

      {sessionInfo?.status === "COMPLETED" && (
        <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
          <Card className="shadow-card border-primary/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <Trophy className="h-5 w-5 text-primary" />
                <p className="font-medium text-foreground">Session completed</p>
                {sessionResult && (
                  <Badge
                    variant={sessionResult.status === "PASS" ? "default" : "destructive"}
                    className="ml-auto"
                  >
                    {sessionResult.status}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                You scored{" "}
                <span className="font-semibold text-foreground">
                  {sessionResult?.correctAnswersCount ?? sessionInfo.score}/{sessionResult?.totalQuestions ?? sessionInfo.totalQuestions}
                </span>
                {sessionResult && (
                  <>
                    {" "}({Math.round(sessionResult.scorePercentage)}%)
                  </>
                )}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate("/student/quizzes")}
                >
                  Back to quizzes
                </Button>
                <Button
                  className="gradient-cta text-primary-foreground"
                  onClick={() => {
                    if (!studentId || !quizId) return;
                    startSession.mutate(
                      { studentId, quizId },
                      {
                        onSuccess: (res) => {
                          setSessionId(res.id);
                          setSelectedOptionId(null);
                          setSavedAnswers({});
                          toast.success("New attempt started.");
                        },
                        onError: (err: any) => toast.error(err?.message || "Could not start a new attempt."),
                      }
                    );
                  }}
                  disabled={startSession.isPending}
                >
                  Retake quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {sessionInfo?.status === "ACTIVE" && (
        <motion.div {...fadeIn} transition={{ delay: 0.15 }}>
          <div className="grid grid-cols-1 xl:grid-cols-[1fr,260px] gap-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Question Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium text-foreground">
                      {currentQuestion ? `${currentQuestion.questionIndex}/${currentQuestion.totalQuestions}` : "-"}
                    </span>
                  </div>
                  <Progress value={progressValue} />
                </div>

                {loadingQuestion ? (
                  <p className="text-sm text-muted-foreground">Loading question...</p>
                ) : currentQuestion ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Question {currentQuestion.questionIndex}</span>
                      <span>{selectedOptionId ? "Answer saved" : "Not yet answered"}</span>
                    </div>
                    <div className="rounded-lg border border-border bg-secondary/30 p-4">
                      <p className="text-base font-medium text-foreground">{currentQuestion.question.text}</p>
                    </div>

                    <div className="space-y-2">
                      {currentQuestion.question.options.map((option) => {
                        const isSelected = selectedOptionId === option.id;
                        return (
                          <button
                            key={option.id}
                            onClick={() => handleSelectOption(option.id)}
                            className={`w-full text-left rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                              isSelected
                                ? "border-primary bg-primary/10 text-foreground"
                                : "border-border bg-background hover:bg-accent/40"
                            }`}
                          >
                            <span className="inline-flex items-center gap-2">
                              {isSelected ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                              {option.text}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {currentQuestion.questionIndex > 1 && (
                        <Button
                          variant="outline"
                          onClick={handlePrevious}
                          disabled={previousQuestion.isPending}
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" /> Previous
                        </Button>
                      )}

                      {!isLastQuestion ? (
                        <Button
                          className="gradient-cta text-primary-foreground"
                          onClick={handleNext}
                          disabled={nextQuestion.isPending || answerQuestion.isPending}
                        >
                          Next Question
                        </Button>
                      ) : (
                        <Button
                          className="gradient-cta text-primary-foreground"
                          onClick={() => setSummaryOpen(true)}
                        >
                          <Flag className="h-4 w-4 mr-2" /> Finish attempt
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Loading quiz session...</p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 text-primary" /> Quiz navigation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {(summary?.questions ?? []).map((question) => {
                    const isCurrent = currentQuestion?.questionIndex === question.questionIndex;
                    const statusClass = question.answered ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground";
                    return (
                      <button
                        key={question.questionId}
                        onClick={() => {
                          if (!studentId || !sessionId) return;
                          jumpQuestion.mutate(
                            { sessionId, studentId, questionIndex: question.questionIndex },
                            {
                              onError: (err: any) => toast.error(err?.message || "Could not move to that question."),
                            }
                          );
                        }}
                        className={`h-9 rounded-md border text-sm font-medium transition-colors ${
                          isCurrent ? "border-primary bg-primary/20 text-primary" : statusClass
                        }`}
                      >
                        {question.questionIndex}
                      </button>
                    );
                  })}
                </div>
                <div className="text-xs text-muted-foreground flex items-center justify-between">
                  <span>Answered: {(summary?.questions ?? []).filter((q) => q.answered).length}</span>
                  <span>Unanswered: {unansweredCount}</span>
                </div>
                <Button
                  className="w-full bg-yellow-400 text-black hover:bg-yellow-500"
                  onClick={() => setSummaryOpen(true)}
                >
                  <Flag className="h-4 w-4 mr-2" /> Submit all and finish
                </Button>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {!sessionInfo && (
        <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Start a quiz from the quizzes page to begin.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {sessionInfo?.status === "COMPLETED" && review && (
        <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Answer review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {review.questions.map((question) => (
                <div key={question.id} className="rounded-lg border border-border p-4">
                  <p className="text-sm text-muted-foreground mb-2">Question {question.questionIndex}</p>
                  <p className="font-medium text-foreground mb-3">{question.text}</p>
                  <div className="space-y-2">
                    {question.options.map((option) => {
                      const isSelected = question.selectedOptionId === option.id;
                      const isCorrect = option.correct;
                      return (
                        <div
                          key={option.id}
                          className={`rounded-md border px-3 py-2 text-sm ${
                            isCorrect
                              ? "border-emerald-500/40 bg-emerald-500/10"
                              : isSelected
                              ? "border-red-500/40 bg-red-500/10"
                              : "border-border bg-background"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span>{option.text}</span>
                            {isCorrect && <span className="text-xs font-semibold text-emerald-600">Correct</span>}
                            {!isCorrect && isSelected && (
                              <span className="text-xs font-semibold text-red-600">Your answer</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {summaryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Summary of attempt</h3>
              <Button variant="ghost" size="sm" onClick={() => setSummaryOpen(false)}>
                Close
              </Button>
            </div>
            <div className="border border-border rounded-lg">
              <div className="grid grid-cols-2 gap-2 border-b border-border bg-secondary/40 px-4 py-2 text-xs text-muted-foreground">
                <span>Question</span>
                <span>Status</span>
              </div>
              <div className="divide-y divide-border">
                {(summary?.questions ?? []).map((question) => (
                  <div key={question.questionId} className="grid grid-cols-2 gap-2 px-4 py-2 text-sm">
                    <span className="text-foreground">{question.questionIndex}</span>
                    <span className={question.answered ? "text-emerald-600" : "text-muted-foreground"}>
                      {question.answered ? "Answer saved" : "Not answered"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {unansweredCount > 0 && (
              <p className="mt-3 text-xs text-muted-foreground">
                You still have {unansweredCount} unanswered question{unansweredCount === 1 ? "" : "s"}.
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2 justify-end">
              <Button variant="outline" onClick={() => setSummaryOpen(false)}>
                Return to attempt
              </Button>
              <Button
                className="gradient-cta text-primary-foreground"
                onClick={() => {
                  setSummaryOpen(false);
                  handleSubmitQuiz();
                }}
                disabled={submitSession.isPending}
              >
                Submit all and finish
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
