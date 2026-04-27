import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, BookOpen, CalendarDays, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCourses, useTimetable, useAllStudents, dayDisplayName, formatTime } from "@/lib/api";
import type { TimetableSlot } from "@/lib/api";
import TeacherFinancialSummary from "../../components/teacher/TeacherFinancialSummary";

export default function TeacherDashboard() {
  const { data: courses = [], isLoading: loadingCourses } = useCourses();
  const { data: timetable = [], isLoading: loadingTimetable } = useTimetable();
  const { data: students = [], isLoading: loadingStudents } = useAllStudents();

  const teacherName = localStorage.getItem("authName") || "Teacher";

  // Today's day of week as backend enum e.g. "MONDAY"
  const todayEnum = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][new Date().getDay()];
  const todaySlots = timetable.filter((s) => s.dayOfWeek === todayEnum);

  // Live-detection: re-render every 10s with real timestamp
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(id);
  }, []);

  /** True from class start until 10 min after class end (for Start Now button) */
  const isJoinable = (slot: TimetableSlot) => {
    const d = new Date(now);
    const nowMin = d.getHours() * 60 + d.getMinutes();
    const [sh, sm] = slot.startTime.split(":").map(Number);
    const [eh, em] = slot.endTime.split(":").map(Number);
    return nowMin >= sh * 60 + sm && nowMin < eh * 60 + em + 10;
  };

  const stats = [
    { label: "Total Students", value: String(students.length), icon: Users },
    { label: "Courses", value: String(courses.length), icon: BookOpen },
    { label: "Timetable Slots", value: String(timetable.length), icon: CalendarDays },
  ];

  const loading = loadingCourses || loadingTimetable || loadingStudents;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Welcome back, {teacherName}! </h1>
        <p className="text-muted-foreground mt-1">Here's what's happening today</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="rounded-xl bg-card border border-border p-5 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{loading ? "–" : s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Today's Classes */}
      <div className="rounded-xl bg-card border border-border p-6 shadow-card">
        <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" /> Today's Classes ({dayDisplayName(todayEnum)})
        </h2>
        {loadingTimetable ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : todaySlots.length === 0 ? (
          <p className="text-sm text-muted-foreground">No classes scheduled for today.</p>
        ) : (
          <div className="space-y-3">
            {todaySlots.map((slot) => (
              <div key={slot.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium text-muted-foreground w-32">
                    <Clock className="h-3 w-3 inline mr-1" />{formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{slot.course?.title ?? "Untitled"}</p>
                    <p className="text-xs text-muted-foreground">{slot.location || "No location"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {slot.meetingLink && (
                    <Button size="sm" className="gap-1.5 gradient-cta text-primary-foreground"
                      onClick={() => window.open(slot.meetingLink, "_blank")}>
                      <ExternalLink className="h-3.5 w-3.5" /> Start Now
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Financial Read Only Wrapper */}
      <TeacherFinancialSummary />
    </div>
  );
}
