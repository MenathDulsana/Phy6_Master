import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  GraduationCap,
  BookOpen,
  Download,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Calendar,
  CreditCard,
  Play,
  Lock,
  Clock,
  RefreshCcw,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useCourses,
  useEnrollStudent,
  useUnenrollStudent,
  useLessons,
  useMaterials,
  getMaterialDownloadUrl,
  useTimetableForCourse,
} from "@/lib/api";
import { useAllEnrollments, useWithdrawPayment } from "@/lib/api/students";
import type { EnrollmentSummary } from "@/lib/api/students";
import type { Course, Lesson } from "@/lib/api";

const userId = () => Number(localStorage.getItem("authUserId")) || 0;

/* ──── helpers ──── */
function formatMonth(m: string): string {
  if (!m || m.length < 7) return "Unassigned";
  const [y, mo] = m.split("-");
  const date = new Date(Number(y), Number(mo) - 1);
  return date.toLocaleString("default", { month: "long", year: "numeric" });
}

function groupByMonth(lessons: Lesson[]): Record<string, Lesson[]> {
  const groups: Record<string, Lesson[]> = {};
  for (const l of lessons) {
    const key = l.month || "none";
    if (!groups[key]) groups[key] = [];
    groups[key].push(l);
  }
  const sorted: Record<string, Lesson[]> = {};
  Object.keys(groups).sort().forEach((k) => { sorted[k] = groups[k]; });
  return sorted;
}

/* ═══════════════════════════════════════════════════════════
   ENROLLED course card – wide, months always visible
   ═══════════════════════════════════════════════════════════ */
function EnrolledCourseCard({ course }: { course: Course }) {
  const uid = userId();
  const navigate = useNavigate();
  const unenrollMut = useUnenrollStudent();
  const withdrawMut = useWithdrawPayment();
  const { data: allEnrollments = [] } = useAllEnrollments(uid || undefined);
  const myEnrollment = allEnrollments.find((e: EnrollmentSummary) => e.courseId === course.id);
  const isPending = myEnrollment?.status === "PENDING";
  const isSubmitted = myEnrollment?.status === "PAYMENT_SUBMITTED";
  const isRejected = myEnrollment?.status === "REJECTED";
  const isRefunded = myEnrollment?.status === "REFUNDED";

  const handleDrop = () => {
    if (confirm("Are you sure you want to drop this class? You will lose access to all lessons and materials.")) {
      unenrollMut.mutate({ userId: uid, courseId: course.id }, {
        onSuccess: () => toast.success("Class dropped successfully"),
        onError: () => toast.error("Failed to drop class")
      });
    }
  };

  const handleWithdraw = () => {
    if (confirm("Are you sure you want to withdraw your submitted payment? Your enrollment will be reset to Pending so you can re-submit.")) {
      withdrawMut.mutate({ studentId: uid, courseId: course.id }, {
        onSuccess: () => toast.success("Payment submission withdrawn. You can now re-submit."),
        onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Failed to withdraw payment")
      });
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border bg-card shadow-card overflow-hidden ${isPending ? 'border-yellow-500/50 relative' : isSubmitted ? 'border-blue-500/50 relative' : isRejected ? 'border-red-500/50 relative' : isRefunded ? 'border-purple-500/50 relative' : 'border-border'}`}>
      
      {/* Top bar: image + info */}
      <div className="flex items-center gap-4 p-5 border-b border-border">
        <div className="h-14 w-14 rounded-lg bg-accent flex items-center justify-center shrink-0 overflow-hidden">
          {course.imageUrl ? (
            <img src={course.imageUrl} alt="" className="h-14 w-14 object-cover" />
          ) : (
            <GraduationCap className="h-6 w-6 text-primary" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-semibold text-foreground truncate">{course.title}</h3>
            {isPending && <span className="bg-yellow-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">Pending Payment</span>}
            {isSubmitted && <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">Verifying Payment</span>}
            {isRejected && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">Payment Rejected</span>}
            {isRefunded && <span className="bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">Payment Refunded</span>}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            {course.subject && <span>{course.subject}</span>}
            {course.batch && <span className="px-2 py-0.5 rounded bg-accent text-accent-foreground">{course.batch}</span>}
            {course.teacher && <span>· {course.teacher.name}</span>}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          {isSubmitted && (
            <Button
              variant="ghost" size="sm"
              className="text-amber-600 hover:bg-amber-500/10 hover:text-amber-700 text-xs h-8 px-2.5"
              disabled={withdrawMut.isPending}
              onClick={handleWithdraw}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              {withdrawMut.isPending ? "Withdrawing…" : "Withdraw"}
            </Button>
          )}
          <Button variant="ghost" size="sm" className="text-destructive/80 hover:bg-destructive/10 hover:text-destructive text-xs h-8 px-2.5" onClick={handleDrop}>
            Drop Class
          </Button>
        </div>
      </div>

      {isPending ? (
        <div className="p-8 flex flex-col items-center justify-center text-center bg-yellow-500/5">
           <Lock className="h-10 w-10 text-yellow-500 mb-3 opacity-80" />
           <h4 className="font-semibold text-foreground mb-1">Finish Your Enrollment</h4>
           <p className="text-sm text-muted-foreground max-w-sm mb-5">
             You have been enrolled in {course.title}, but your status is pending. Please complete the admission or course fee payment to unlock access to lessons and resources.
           </p>
           <Button className="gradient-cta text-primary-foreground gap-2" onClick={() => navigate(`/student/classes/${course.id}/payment`)}>
             <CreditCard className="h-4 w-4" /> Complete Payment
           </Button>
        </div>
      ) : isSubmitted ? (
        <div className="p-8 flex flex-col items-center justify-center text-center bg-blue-500/5">
           <Clock className="h-10 w-10 text-blue-500 mb-3 opacity-80" />
           <h4 className="font-semibold text-foreground mb-1">Payment Verification in Progress</h4>
           <p className="text-sm text-muted-foreground max-w-sm mb-5">
             You have submitted a payment for {course.title}. Please wait while our accountants verify it. You will be notified once approved.
           </p>
        </div>
      ) : isRejected ? (
        <div className="p-8 flex flex-col items-center justify-center text-center bg-red-500/5">
           <Lock className="h-10 w-10 text-red-500 mb-3 opacity-80" />
           <h4 className="font-semibold text-foreground mb-1">Payment Rejected</h4>
           <p className="text-sm text-muted-foreground max-w-sm mb-5">
             Your submitted payment for {course.title} was rejected by the accountant. Please check your bank receipt and try submitting your payment again.
           </p>
           <Button className="gradient-cta text-primary-foreground gap-2" onClick={() => navigate(`/student/classes/${course.id}/payment`)}>
             <CreditCard className="h-4 w-4" /> Re-submit Payment
           </Button>
        </div>
      ) : isRefunded ? (
        <div className="p-8 flex flex-col items-center justify-center text-center bg-purple-500/5">
           <RefreshCcw className="h-10 w-10 text-purple-500 mb-3 opacity-80" />
           <h4 className="font-semibold text-foreground mb-1">Payment Refunded</h4>
           <p className="text-sm text-muted-foreground max-w-sm mb-5">
             Your Stripe payment for {course.title} was refunded. Your access has been paused. Please re-submit payment if you wish to continue.
           </p>
           <Button className="gradient-cta text-primary-foreground gap-2" onClick={() => navigate(`/student/classes/${course.id}/payment`)}>
             <CreditCard className="h-4 w-4" /> Re-submit Payment
           </Button>
        </div>
      ) : (
        <MonthLessonsPanel courseId={course.id} />
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   AVAILABLE course card – compact grid card with Enroll Now
   ═══════════════════════════════════════════════════════════ */
function AvailableCourseCard({ course, enrollmentStatus }: { course: Course; enrollmentStatus?: string }) {
  const uid = userId();
  const navigate = useNavigate();
  const enrollMut = useEnrollStudent();
  const [justEnrolled, setJustEnrolled] = useState(false);

  const handleContinuePayment = () => navigate(`/student/classes/${course.id}/payment`);

  const handleEnroll = () => {
    if (!uid) {
      toast.error("Please sign in to enroll.");
      return;
    }
    enrollMut.mutate(
      { userId: uid, courseId: course.id },
      {
        onSuccess: () => {
          toast.success(`Enrolled in ${course.title}! Complete your payment to get access.`);
          setJustEnrolled(true);
          navigate(`/student/classes/${course.id}/payment`);
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : "";
          if (msg.toLowerCase().includes("already enrolled")) {
            // Student already has an enrollment — send to payment page so they can
            // complete or re-submit their payment (PaymentService handles duplicates).
            navigate(`/student/classes/${course.id}/payment`);
          } else {
            toast.error(msg || "Enrollment failed.");
          }
        },
      }
    );
  };

  const hasRecord = !!enrollmentStatus;
  const optimisticPending = (justEnrolled || enrollMut.isSuccess) && !hasRecord;
  const isFullyEnrolled = enrollmentStatus === "ACTIVE" || enrollmentStatus === "APPROVED";
  const isPendingPayment = enrollmentStatus === "PENDING" || optimisticPending;
  const isVerifying = enrollmentStatus === "PAYMENT_SUBMITTED";
  const isRejected = enrollmentStatus === "REJECTED";
  const isRefunded = enrollmentStatus === "REFUNDED";

  let buttonLabel: string;
  let buttonClass: string;
  let buttonDisabled: boolean;
  let onClick: () => void;

  if (isFullyEnrolled) {
    buttonLabel = "✓ Enrolled";
    buttonClass = "bg-green-600 hover:bg-green-700";
    buttonDisabled = true;
    onClick = () => {};
  } else if (isVerifying) {
    buttonLabel = "Verifying payment";
    buttonClass = "bg-blue-600/90 hover:bg-blue-700";
    buttonDisabled = true;
    onClick = () => {};
  } else if (isPendingPayment) {
    buttonLabel = "Payment pending";
    buttonClass = "bg-amber-500 hover:bg-amber-600";
    buttonDisabled = false;
    onClick = handleContinuePayment;
  } else if (isRejected) {
    buttonLabel = "Payment rejected — retry";
    buttonClass = "bg-red-600/90 hover:bg-red-700";
    buttonDisabled = false;
    onClick = handleContinuePayment;
  } else if (isRefunded) {
    buttonLabel = "Refunded — pay again";
    buttonClass = "bg-purple-600/90 hover:bg-purple-700";
    buttonDisabled = false;
    onClick = handleContinuePayment;
  } else {
    buttonLabel = "Enroll Now";
    buttonClass = "gradient-cta";
    buttonDisabled = false;
    onClick = handleEnroll;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card shadow-card hover:shadow-glow transition-shadow flex flex-col overflow-hidden">
      {course.imageUrl && (
        <div className="overflow-hidden">
          <img src={course.imageUrl} alt={course.title} className="w-full h-36 object-cover" />
        </div>
      )}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-lg bg-accent flex items-center justify-center shrink-0">
            {course.imageUrl ? (
              <img src={course.imageUrl} alt="" className="h-11 w-11 rounded-lg object-cover" />
            ) : (
              <GraduationCap className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-foreground truncate">{course.title}</h3>
            {course.subject && <p className="text-xs text-muted-foreground">{course.subject}</p>}
          </div>
        </div>
        {course.description && <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{course.description}</p>}
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          {course.batch && <span className="px-2 py-0.5 rounded bg-accent text-accent-foreground">{course.batch}</span>}
          {course.teacher && <span>· {course.teacher.name}</span>}
        </div>
        <div className="mt-auto pt-5">
          <Button
            size="sm"
            className={`w-full ${buttonClass} text-primary-foreground`}
            onClick={onClick}
            disabled={enrollMut.isPending || buttonDisabled}
          >
            {enrollMut.isPending && !hasRecord ? "Enrolling..." : buttonLabel}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   Month-wise lessons panel (inside enrolled card)
   ══════════════════════════════════════════ */
function MonthLessonsPanel({ courseId }: { courseId: number }) {
  const uid = userId();
  const navigate = useNavigate();
  const { data: lessons = [], isLoading } = useLessons(courseId);
  const { data: timetableSlots = [] } = useTimetableForCourse(courseId, uid || undefined);
  const [openMonth, setOpenMonth] = useState<string | null>(null);
  const [showMonthResources, setShowMonthResources] = useState<{ monthKey: string; monthLabel: string; lessonIds: number[] } | null>(null);

  // Find the first meeting link from this course's timetable slots
  const meetingLink = timetableSlots.find((s) => s.meetingLink)?.meetingLink;

  if (isLoading) return <div className="p-4 text-sm text-muted-foreground">Loading lessons...</div>;
  if (lessons.length === 0) return <div className="p-4 text-sm text-muted-foreground text-center">No lessons available yet.</div>;

  const grouped = groupByMonth(lessons);

  return (
    <div className="bg-secondary/30">
      {Object.entries(grouped).map(([monthKey, monthLessons]) => (
          <div key={monthKey} className="border-b border-border last:border-b-0">
            {/* Month header */}
            <div className="flex items-center gap-2 px-4 py-3 hover:bg-accent/30 transition-colors">
              <button className="flex items-center gap-2 flex-1 text-left"
                onClick={() => setOpenMonth(openMonth === monthKey ? null : monthKey)}>
                {openMonth === monthKey ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">{formatMonth(monthKey)}</span>
                <span className="ml-auto text-xs text-muted-foreground mr-2">{monthLessons.length} lesson{monthLessons.length !== 1 ? "s" : ""}</span>
              </button>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button size="sm" variant="outline" className="text-xs gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMonthResources({
                      monthKey,
                      monthLabel: formatMonth(monthKey),
                      lessonIds: monthLessons.map((l) => l.id),
                    });
                  }}>
                  <FileText className="h-3.5 w-3.5" /> Resources
                </Button>
                <Button size="sm" className="text-xs gap-1.5 gradient-cta text-primary-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (meetingLink) {
                      window.open(meetingLink, "_blank");
                    } else {
                      toast.info("No meeting link set for this class yet.");
                    }
                  }}>
                  <Play className="h-3.5 w-3.5" /> Join Now
                </Button>
              </div>
            </div>
            {/* Lesson list */}
            <AnimatePresence>
              {openMonth === monthKey && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden">
                  <div className="divide-y divide-border">
                    {monthLessons.map((l) => (
                      <div key={l.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-accent/20 transition-colors">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{l.title}</p>
                          {l.content && <p className="text-xs text-muted-foreground truncate">{l.content}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
      ))}

      {/* Month resources dialog */}
      {showMonthResources && (
        <MonthResourcesDialog
          open={!!showMonthResources}
          onClose={() => setShowMonthResources(null)}
          courseId={courseId}
          monthLabel={showMonthResources.monthLabel}
          lessonIds={showMonthResources.lessonIds}
          lessons={lessons}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   Month resources dialog
   ══════════════════════════════════════════ */
function MonthResourcesDialog({ open, onClose, courseId, monthLabel, lessonIds, lessons }: {
  open: boolean; onClose: () => void; courseId: number; monthLabel: string;
  lessonIds: number[]; lessons: Lesson[];
}) {
  const uid = userId();
  const { data: allMaterials = [], isLoading } = useMaterials(open ? courseId : undefined, uid || undefined);
  const idSet = new Set(lessonIds);
  const materials = allMaterials.filter((m) => m.lesson?.id && idSet.has(m.lesson.id));

  const byLesson: Record<number, typeof materials> = {};
  for (const m of materials) {
    const lid = m.lesson!.id;
    if (!byLesson[lid]) byLesson[lid] = [];
    byLesson[lid].push(m);
  }
  const lessonMap = new Map(lessons.map((l) => [l.id, l.title]));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{monthLabel} — Resources</DialogTitle></DialogHeader>
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Loading resources...</p>
        ) : materials.length === 0 ? (
          <div className="py-10 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No resources for this month yet.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(byLesson).map(([lid, mats]) => (
              <div key={lid}>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {lessonMap.get(Number(lid)) || "Lesson"}
                </h4>
                <div className="space-y-2">
                  {mats.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <div className="h-9 w-9 rounded bg-accent flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{m.type}</p>
                      </div>
                      {m.type === "VIDEO" ? (
                        <a
                          href={getMaterialDownloadUrl(m.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-foreground/70 bg-transparent text-foreground transition-colors hover:border-foreground hover:bg-muted/30"
                          aria-label="Play video"
                        >
                          {/* Stroked triangle — Lucide Play is fill-only; reference uses outline play */}
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
                            <polygon
                              points="8 6 18 12 8 18"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.75"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </a>
                      ) : m.type === "LINK" ? (
                        <a href={m.url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-foreground/70 bg-transparent hover:bg-muted/30">
                            <ExternalLink className="h-4 w-4 stroke-[1.75]" />
                          </Button>
                        </a>
                      ) : (
                        <a href={getMaterialDownloadUrl(m.id)} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-foreground/70 bg-transparent hover:bg-muted/30">
                            <Download className="h-4 w-4 stroke-[1.75]" />
                          </Button>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE — two sections: My Classes + Available Classes
   ═══════════════════════════════════════════════════════════ */
export default function StudentClasses() {
  const uid = userId();
  const { data: allCourses = [], isLoading: loadingAll } = useCourses();
  const { data: allEnrollments = [], isLoading: loadingEnrollments } = useAllEnrollments(uid || undefined);

  const myClasses = useMemo(() => {
    const courseById = new Map(allCourses.map((course) => [course.id, course]));
    const uniqueByCourseId = new Map<number, Course>();

    for (const enrollment of allEnrollments) {
      if (!uniqueByCourseId.has(enrollment.courseId)) {
        uniqueByCourseId.set(
          enrollment.courseId,
          courseById.get(enrollment.courseId) ?? {
            id: enrollment.courseId,
            title: enrollment.courseName,
          }
        );
      }
    }

    return Array.from(uniqueByCourseId.values());
  }, [allCourses, allEnrollments]);

  const loading = loadingAll || loadingEnrollments;

  return (
    <div className="space-y-10">
      {/* ── Section 1: My Classes (enrolled) ── */}
      <section>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" /> My Classes
        </motion.h1>

        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        ) : myClasses.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
            <GraduationCap className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">You haven't enrolled in any classes yet.</p>
            <p className="text-muted-foreground text-xs mt-1">Browse available classes below to get started.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            {myClasses.map((c) => <EnrolledCourseCard key={c.id} course={c} />)}
          </div>
        )}
      </section>

      {/* ── Section 2: Available Classes (not enrolled) ── */}
      <section>
        <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="font-display text-xl font-bold text-foreground flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" /> Available Classes
        </motion.h2>

        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        ) : allCourses.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
            <p className="text-muted-foreground text-sm">No classes available right now.</p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {allCourses.map((c) => {
              const st = allEnrollments.find((e) => e.courseId === c.id)?.status;
              return <AvailableCourseCard key={c.id} course={c} enrollmentStatus={st} />;
            })}
          </div>
        )}
      </section>
    </div>
  );
}
