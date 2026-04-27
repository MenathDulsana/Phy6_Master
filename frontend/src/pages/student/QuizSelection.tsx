import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useActiveQuizSession, useStudentCourses, useStudentQuizResults, useVisibleQuizzes } from "@/lib/api";

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

export default function QuizSelection() {
  const navigate = useNavigate();
  const studentId = Number(localStorage.getItem("authUserId")) || undefined;

  const { data: courses = [] } = useStudentCourses(studentId);
  const [courseId, setCourseId] = useState<number | undefined>();
  const [quizId, setQuizId] = useState<number | undefined>();

  const { data: visibleQuizzes = [], isLoading: loadingQuizzes, error: visibleError } = useVisibleQuizzes(studentId, courseId);
  const { data: activeSession, error: activeSessionError } = useActiveQuizSession(studentId, quizId);
  const { data: quizResults = [] } = useStudentQuizResults(studentId);


  useEffect(() => {
    if (!courseId && courses.length > 0) {
      setCourseId(courses[0].id);
    }
  }, [courseId, courses]);

  useEffect(() => {
    if (courseId && visibleQuizzes.length > 0) {
      const stillExists = visibleQuizzes.some((q) => q.id === quizId);
      if (!stillExists) {
        setQuizId(visibleQuizzes[0].id);
      }
    }
    if (courseId && visibleQuizzes.length === 0) {
      setQuizId(undefined);
    }
  }, [courseId, quizId, visibleQuizzes]);

  useEffect(() => {
    const status = (visibleError as any)?.status || (activeSessionError as any)?.status;
    if (status === 403) {
      toast.error("You are not allowed to access this quiz.");
      navigate("/student/dashboard");
    }
  }, [activeSessionError, navigate, visibleError]);

  const resultByQuizId = useMemo(() => {
    const map = new Map<number, (typeof quizResults)[number]>();
    quizResults.forEach((result) => {
      map.set(result.quizId, result);
    });
    return map;
  }, [quizResults]);

  const handleStartOrResume = (targetQuizId?: number) => {
    const resolvedQuizId = targetQuizId ?? quizId;
    if (!studentId || !resolvedQuizId) return;
    navigate(`/student/quizzes/${resolvedQuizId}`);
  };

  return (
    <div className="space-y-6">
      <motion.div {...fadeIn} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-foreground">Choose Class and Quiz</h1>
      </motion.div>

      <motion.div {...fadeIn} transition={{ delay: 0.05 }}>
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Quiz selection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={courseId ?? ""}
                onChange={(e) => {
                  const nextCourseId = Number(e.target.value);
                  setCourseId(Number.isFinite(nextCourseId) ? nextCourseId : undefined);
                }}
              >
                <option value="">Select class</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
            </div>

            {loadingQuizzes && <p className="text-sm text-muted-foreground">Loading quizzes...</p>}
            {!loadingQuizzes && courseId && visibleQuizzes.length === 0 && (
              <p className="text-sm text-muted-foreground">No published quizzes available for this class.</p>
            )}

            {!loadingQuizzes && visibleQuizzes.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {visibleQuizzes.map((quiz) => {
                  const isSelected = quiz.id === quizId;
                  const isActive =
                    activeSession?.quizId === quiz.id &&
                    activeSession?.status === "ACTIVE" &&
                    !!activeSession?.hasAnswers;
                  const latestResult = resultByQuizId.get(quiz.id);
                  const questionCount = quiz.questions?.length;
                  return (
                    <button
                      type="button"
                      key={quiz.id}
                      onClick={() => setQuizId(quiz.id)}
                      onDoubleClick={() => handleStartOrResume(quiz.id)}
                      className={`rounded-lg border p-4 text-left transition-colors ${
                        isSelected ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-accent/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-foreground">{quiz.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {questionCount ? `${questionCount} questions` : "Questions not loaded"}
                          </p>
                          {latestResult && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Last score:{" "}
                              <span className="font-semibold text-foreground">
                                {Math.round(latestResult.scorePercentage)}%
                              </span>{" "}
                              ({latestResult.correctAnswers}/{latestResult.totalQuestions})
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {isSelected ? "Double click to open" : "Tap to select"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
