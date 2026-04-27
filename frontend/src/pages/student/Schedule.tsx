import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalIcon, Clock, X, Video, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTimetable, useStudentCourses, dayDisplayName, formatTime, dayToGridIndex } from "@/lib/api";
import { get } from "@/lib/api-client";
import type { TimetableSlot } from "@/lib/api";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dayEnumOrder = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const hours = Array.from({ length: 16 }, (_, i) => i + 7); // 7:00 - 22:00
const CELL_H = 56; // px per hour row

export default function Schedule() {
  const userId = Number(localStorage.getItem("authUserId")) || undefined;
  const { data: timetable = [], isLoading } = useTimetable();
  const { data: courses = [] } = useStudentCourses(userId);
  const [selected, setSelected] = useState<TimetableSlot | null>(null);

  // Filter timetable to enrolled courses only
  const enrolledIds = new Set(courses.map((c) => c.id));
  const filtered = timetable.filter((s) => enrolledIds.has(s.course?.id));

  const handleJoinClass = async (slot: TimetableSlot) => {
    if (!userId || !slot.course?.id || !slot.meetingLink) return;
    try {
      const access = await get<{ canAccess: boolean; status: string; message: string }>(
        `/api/student/enrollments/access/${userId}/${slot.course.id}`
      );
      if (!access.canAccess) {
        toast.error(access.message);
        return;
      }
      window.open(slot.meetingLink, "_blank");
    } catch {
      toast.error("Unable to verify class access at the moment.");
    }
  };

  if (isLoading) {
    return <div className="p-6 text-muted-foreground">Loading schedule...</div>;
  }

  return (
    <div className="space-y-6">
      <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="font-display text-2xl font-bold text-foreground">Schedule</motion.h1>

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">No classes scheduled. Enroll in a course to see your schedule.</p>
      )}

      <div className="rounded-xl border border-border bg-card overflow-auto shadow-card">
        <div className="min-w-[700px]">
          {/* Header */}
          <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border">
            <div className="p-3 text-xs text-muted-foreground font-medium">Time</div>
            {days.map((d) => <div key={d} className="p-3 text-xs font-semibold text-foreground text-center border-l border-border">{d}</div>)}
          </div>
          {/* Body */}
          <div className="relative">
            {hours.map((h) => (
              <div key={h} className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border last:border-0">
                <div className="p-3 text-xs text-muted-foreground">{h}:00</div>
                {days.map((_, di) => <div key={di} className="border-l border-border relative" style={{ height: CELL_H }} />)}
              </div>
            ))}
            {/* Event overlay — covers only the day columns */}
            <div className="absolute top-0 bottom-0 right-0 pointer-events-none" style={{ left: 80 }}>
              {filtered.map((ev) => {
                const startH = parseInt(ev.startTime.split(":")[0], 10);
                const startM = parseInt(ev.startTime.split(":")[1], 10);
                const endH = parseInt(ev.endTime.split(":")[0], 10);
                const endM = parseInt(ev.endTime.split(":")[1], 10);
                const dayIdx = dayToGridIndex(ev.dayOfWeek);
                const top = ((startH - 7) + startM / 60) * CELL_H;
                const height = Math.max(((endH - startH) + (endM - startM) / 60) * CELL_H, 24);
                const colPct = 100 / 7;
                return (
                  <button key={ev.id} onClick={() => setSelected(ev)}
                    className="absolute rounded-lg border-l-4 p-2 text-xs font-medium cursor-pointer hover:opacity-90 transition-opacity pointer-events-auto bg-blue-500/15 border-blue-500/40 text-blue-600 dark:text-blue-400"
                    style={{ top, height, left: `calc(${dayIdx * colPct}% + 4px)`, width: `calc(${colPct}% - 8px)` }}>
                    <span className="block truncate font-semibold">{ev.course?.title}</span>
                    <span className="block text-[10px] opacity-80">{formatTime(ev.startTime)} – {formatTime(ev.endTime)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-display font-bold text-foreground">{selected.course?.title}</h3>
                <button onClick={() => setSelected(null)}><X className="h-5 w-5 text-muted-foreground" /></button>
              </div>
              <div className="space-y-3 text-sm">
                <p className="flex items-center gap-2 text-muted-foreground"><CalIcon className="h-4 w-4" /> {dayDisplayName(selected.dayOfWeek)}</p>
                <p className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" /> {formatTime(selected.startTime)} – {formatTime(selected.endTime)}</p>
                {selected.location && <p className="flex items-center gap-2 text-muted-foreground"><Video className="h-4 w-4" /> {selected.location}</p>}
                {selected.meetingLink && (
                  <Button className="w-full mt-2 gap-1.5 gradient-cta text-primary-foreground"
                    onClick={() => handleJoinClass(selected)}>
                    <ExternalLink className="h-4 w-4" /> Join Live Class
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
