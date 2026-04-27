import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, BookOpen, CalendarDays, Clock, ExternalLink, X, ChevronLeft, Lock, ClipboardCheck, Trophy, Percent, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAnnouncementsForStudent, useStudentDashboard, useTimetable, dayDisplayName, formatTime } from "@/lib/api";
import type { TimetableSlot, Announcement } from "@/lib/api";
import { useAllEnrollments } from "@/lib/api/students";
import type { EnrollmentSummary } from "@/lib/api/students";



const card = "rounded-xl border border-border bg-card p-5 shadow-card";
const fadeIn = { initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 } };

export default function Dashboard() {
  const userId = Number(localStorage.getItem("authUserId")) || undefined;
  const studentName = localStorage.getItem("authName") || "Student";
  const { data: allEnrollments = [], isLoading: loadingEnrollments } = useAllEnrollments(userId);
  const { data: timetable = [], isLoading: loadingTimetable } = useTimetable();
  const { data: announcements = [], isLoading: loadingAnnouncements } = useAnnouncementsForStudent(userId);
  const { data: quizDashboard, isLoading: loadingQuizDashboard } = useStudentDashboard(userId);

  const [readAnnouncements, setReadAnnouncements] = useState<Set<number>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Today's day of week as backend enum
  const todayEnum = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][new Date().getDay()];

  // Filter timetable to courses the student is enrolled in
  const enrolledCourseIds = new Set(allEnrollments.filter((e: EnrollmentSummary) => e.status === 'ACTIVE' || e.status === 'APPROVED' || e.status === 'PENDING' || e.status === 'PAYMENT_SUBMITTED').map((e: EnrollmentSummary) => e.courseId));
  const todaySlots = timetable
    .filter((s) => s.dayOfWeek === todayEnum && enrolledCourseIds.has(s.course?.id))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Live-detection: re-render every 10s with real timestamp
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(id);
  }, []);

  /** True only while class is actually running (for LIVE badge) */
  const isLive = (slot: TimetableSlot) => {
    const d = new Date(now);
    const nowMin = d.getHours() * 60 + d.getMinutes();
    const [sh, sm] = slot.startTime.split(":").map(Number);
    const [eh, em] = slot.endTime.split(":").map(Number);
    return nowMin >= sh * 60 + sm && nowMin < eh * 60 + em;
  };

  /** True from 10 minutes before class start until 10 minutes after class end (for Join Now) */
  const isJoinable = (slot: TimetableSlot) => {
    const d = new Date(now);
    const nowMin = d.getHours() * 60 + d.getMinutes();
    const [sh, sm] = slot.startTime.split(":").map(Number);
    const [eh, em] = slot.endTime.split(":").map(Number);
    return nowMin >= sh * 60 + sm - 10 && nowMin < eh * 60 + em + 10;
  };

  // Hydrate read state from localStorage (same source of truth as NotificationBell)
  useEffect(() => {
    const stored = localStorage.getItem("readAnnouncements");
    if (stored) {
      try {
        setReadAnnouncements(new Set(JSON.parse(stored)));
      } catch {
        localStorage.removeItem("readAnnouncements");
      }
    }
  }, []);

  const markRead = (id: number) => {
    const updated = new Set(readAnnouncements);
    updated.add(id);
    setReadAnnouncements(updated);
    localStorage.setItem("readAnnouncements", JSON.stringify(Array.from(updated)));
  };

  const markAllRead = () => {
    const updated = new Set(announcements.map((a) => a.id));
    setReadAnnouncements(updated);
    localStorage.setItem("readAnnouncements", JSON.stringify(Array.from(updated)));
  };

  const openAnnouncement = (announcement: Announcement) => {
    markRead(announcement.id);
    setSelectedAnnouncement(announcement);
  };

  const closeAnnouncement = () => {
    setSelectedAnnouncement(null);
  };

  const displayed = showAll ? announcements : announcements.slice(0, 3);
  const unreadCount = announcements.filter((a) => !readAnnouncements.has(a.id)).length;
  const totalQuizzes = quizDashboard?.totalQuizzes ?? 0;
  const averageScore = Math.round(quizDashboard?.averageScore ?? 0);
  const highestScore = Math.round(quizDashboard?.highestScore ?? 0);
  const lowestScore = Math.round(quizDashboard?.lowestScore ?? 0);
  const recentAttempts = quizDashboard?.recentAttempts ?? [];

  return (
    <div className="space-y-6">
      <motion.h1 {...fadeIn} className="font-display text-2xl font-bold text-foreground">
        Welcome back, {studentName}!
      </motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enrolled Courses */}
        <motion.div {...fadeIn} transition={{ delay: 0.1 }} className={`${card} lg:col-span-2`}>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="font-display font-semibold text-foreground">My Enrollments</h2>
          </div>

          {loadingEnrollments ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : allEnrollments.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 bg-secondary/50 rounded-lg border border-border">
              <BookOpen className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
              <p className="text-sm text-foreground font-medium">You have not enrolled in any classes yet.</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">Browse available classes to get started.</p>
              <Button onClick={() => window.location.href='/student/classes'} variant="outline" size="sm">Browse Classes</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {allEnrollments.map((e: EnrollmentSummary) => {
                const isPending = e.status === "PENDING";
                const isRejected = e.status === "REJECTED";
                const isActive = e.status === "ACTIVE" || e.status === "APPROVED";
                const isSubmitted = e.status === "PAYMENT_SUBMITTED";
                
                return (
                  <div key={e.id} className={`flex items-center justify-between p-3 rounded-lg border ${isPending ? 'border-yellow-500/30 bg-yellow-500/10' : isSubmitted ? 'border-blue-500/30 bg-blue-500/10' : isActive ? 'border-green-500/30 bg-green-500/10' : 'bg-secondary border-border'}`}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`font-medium text-sm ${isPending ? 'text-yellow-600 dark:text-yellow-400' : isSubmitted ? 'text-blue-600 dark:text-blue-400' : isActive ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                          {e.courseName}
                        </p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                          isPending ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' : 
                          isSubmitted ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' : 
                          isActive ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 
                          'bg-red-500/20 text-red-600 dark:text-red-400'
                        }`}>
                          {e.status === 'PAYMENT_SUBMITTED' ? 'VERIFYING' : e.status}
                        </span>
                      </div>
                      <p className={`text-xs ${isPending ? 'text-yellow-600/80 dark:text-yellow-400/80' : isSubmitted ? 'text-blue-600/80 dark:text-blue-400/80' : 'text-muted-foreground'}`}>
                        {e.message || `Enrolled on ${new Date(e.enrollmentDate).toLocaleDateString()}`}
                      </p>
                    </div>
                    {isPending && <Lock className="h-4 w-4 text-yellow-500 opacity-70" />}
                    {isSubmitted && <Clock className="h-4 w-4 text-blue-500 opacity-70" />}
                    {isActive && <Check className="h-4 w-4 text-green-500 opacity-70" />}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Today's Schedule */}
        <motion.div {...fadeIn} transition={{ delay: 0.15 }} className={card}>
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h2 className="font-display font-semibold text-foreground">Today ({dayDisplayName(todayEnum)})</h2>
          </div>
          {loadingTimetable ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : todaySlots.length === 0 ? (
            <p className="text-sm text-muted-foreground">No classes scheduled for today.</p>
          ) : (
            <div className="space-y-2">
              {todaySlots.map((slot) => {
                const isPending = allEnrollments.some((p: EnrollmentSummary) => p.courseId === slot.course?.id && p.status === 'PENDING');
                const isSubmitted = allEnrollments.some((p: EnrollmentSummary) => p.courseId === slot.course?.id && p.status === 'PAYMENT_SUBMITTED');
                return (
                  <div key={slot.id} className="p-3 rounded-lg bg-secondary">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-foreground">{slot.course?.title}</p>
                        {isPending && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">PENDING PAY</span>}
                        {isSubmitted && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-blue-500/20 text-blue-600 dark:text-blue-400">VERIFYING</span>}
                      </div>
                      {isLive(slot) && !isPending && !isSubmitted && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-500">
                          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" /> LIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" /> {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                    </p>
                    {slot.location && <p className="text-xs text-muted-foreground">{slot.location}</p>}
                    
                    {isPending ? (
                       <Button size="sm" variant="outline" className="mt-2 w-full text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-900 border-yellow-200" disabled>
                         <Lock className="h-3.5 w-3.5 mr-1" /> Pending Payment
                       </Button>
                    ) : isSubmitted ? (
                       <Button size="sm" variant="outline" className="mt-2 w-full text-xs text-blue-600 bg-blue-50 dark:bg-blue-900 border-blue-200" disabled>
                         <Clock className="h-3.5 w-3.5 mr-1" /> Verifying Payment
                       </Button>
                    ) : (
                      isJoinable(slot) && slot.meetingLink && (
                        <Button size="sm" className="mt-2 gap-1.5 gradient-cta text-primary-foreground w-full"
                          onClick={() => window.open(slot.meetingLink, "_blank")}>
                          <ExternalLink className="h-3.5 w-3.5" /> Join Now
                        </Button>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Announcements — real API data, read state synced with NotificationBell */}
        <motion.div {...fadeIn} transition={{ delay: 0.2 }} className={card}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <h2 className="font-display font-semibold text-foreground">Announcements</h2>
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                Mark all read
              </button>
            )}
          </div>

          {loadingAnnouncements ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : announcements.length === 0 ? (
            <p className="text-sm text-muted-foreground">No announcements yet.</p>
          ) : (
            <>
              <div className="space-y-2">
                {displayed.map((a) => {
                  const isRead = readAnnouncements.has(a.id);
                  return (
                    <button
                      key={a.id}
                      onClick={() => openAnnouncement(a)}
                      className={`w-full p-3 rounded-lg text-sm text-left hover:bg-accent/50 transition-colors ${isRead ? "bg-secondary" : "bg-accent border-l-2 border-primary"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground truncate">{a.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(a.createdAt).toLocaleDateString()} · {a.courseName}
                          </p>
                        </div>
                        {!isRead && (
                          <span className="shrink-0 h-2 w-2 rounded-full bg-primary mt-1.5" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {announcements.length > 3 && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="mt-3 text-xs text-primary hover:underline w-full text-center"
                >
                  {showAll ? "Show less" : `View all (${announcements.length})`}
                </button>
              )}
            </>
          )}
        </motion.div>
      </div>

      <motion.div {...fadeIn} transition={{ delay: 0.25 }} className={card}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <h2 className="font-display font-semibold text-foreground">Quiz Progress Overview</h2>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.location.href = "/student/quizzes"}
          >
            Start New Quiz
          </Button>
        </div>

        {loadingQuizDashboard ? (
          <p className="text-sm text-muted-foreground">Loading quiz progress...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="rounded-lg border border-border bg-secondary/40 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  Total Quizzes
                </div>
                <p className="mt-2 text-2xl font-semibold text-foreground">{totalQuizzes}</p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/40 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Percent className="h-4 w-4 text-blue-500" />
                  Average Score
                </div>
                <p className="mt-2 text-2xl font-semibold text-foreground">{averageScore}%</p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/40 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Highest Score
                </div>
                <p className="mt-2 text-2xl font-semibold text-foreground">{highestScore}%</p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/40 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingDown className="h-4 w-4 text-orange-500" />
                  Lowest Score
                </div>
                <p className="mt-2 text-2xl font-semibold text-foreground">{lowestScore}%</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-semibold text-foreground mb-2">Recent Quiz Attempts</p>
              {recentAttempts.length === 0 ? (
                <p className="text-xs text-muted-foreground">No quiz attempts yet.</p>
              ) : (
                <div className="space-y-2">
                  {recentAttempts.map((attempt) => {
                    const scoreValue = Math.round(attempt.scorePercentage);
                    const statusLabel = attempt.status ?? "";
                    const isPass = statusLabel === "PASS";
                    return (
                      <div key={`${attempt.quizId}-${attempt.attemptedAt}`} className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 p-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{attempt.quizTitle}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {new Date(attempt.attemptedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">
                            {attempt.correctAnswers}/{attempt.totalQuestions} ({scoreValue}%)
                          </p>
                          <Badge variant={isPass ? "default" : "destructive"} className="text-[10px]">
                            {statusLabel}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>

      {/* Announcement Detail Modal */}
      <AnimatePresence>
        {selectedAnnouncement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={closeAnnouncement}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                  {selectedAnnouncement.courseName}
                </span>
                <button onClick={closeAnnouncement} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <h3 className="text-xl font-semibold text-foreground mb-2">
                {selectedAnnouncement.title}
              </h3>

              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                <span>By {selectedAnnouncement.teacherName}</span>
                <span>•</span>
                <span>{new Date(selectedAnnouncement.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {selectedAnnouncement.content}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
