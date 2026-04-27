import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Clock, Trash2, Pencil, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  useTimetable, useCreateTimetableSlot, useDeleteTimetableSlot, useUpdateTimetableSlot,
  useCourses, dayDisplayName, formatTime, dayToGridIndex,
} from "@/lib/api";
import type { TimetableSlot, TimetableSlotDTO } from "@/lib/api";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const dayEnums = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

// Generate 30-minute intervals from 07:00 to 22:00
const timeSlots: string[] = [];
for (let h = 7; h <= 21; h++) {
  timeSlots.push(`${String(h).padStart(2, "0")}:00`);
  timeSlots.push(`${String(h).padStart(2, "0")}:30`);
}
timeSlots.push("22:00");

function timeSlotIndex(time: string): number {
  // time from backend is "HH:mm:ss" or "HH:mm"
  const hhmm = time.substring(0, 5);
  return timeSlots.indexOf(hhmm);
}

export default function Timetable() {
  const { data: timetable = [], isLoading } = useTimetable();
  const { data: courses = [] } = useCourses();
  const createSlot = useCreateTimetableSlot();
  const deleteSlot = useDeleteTimetableSlot();
  const updateSlot = useUpdateTimetableSlot();

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [viewMode, setViewMode] = useState<"week" | "list">("week");
  const [selectedEntry, setSelectedEntry] = useState<TimetableSlot | null>(null);
  const [newEntry, setNewEntry] = useState<TimetableSlotDTO>({
    courseId: 0, dayOfWeek: "MONDAY", startTime: "08:00", endTime: "10:00", location: "", meetingLink: "",
  });
  const [editEntry, setEditEntry] = useState<TimetableSlotDTO & { id: number }>({
    id: 0, courseId: 0, dayOfWeek: "MONDAY", startTime: "08:00", endTime: "10:00", location: "", notes: "", meetingLink: "",
  });

  const handleAdd = () => {
    if (!newEntry.courseId || !newEntry.location) {
      toast.error("Please fill in all fields");
      return;
    }
    if (newEntry.endTime <= newEntry.startTime) {
      toast.error("End time must be after start time");
      return;
    }
    createSlot.mutate(newEntry, {
      onSuccess: () => { setShowAdd(false); toast.success("Class scheduled successfully!"); },
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : "Failed to schedule class";
        toast.error(message);
      },
    });
  };

  const handleDelete = (id: number) => {
    deleteSlot.mutate(id, {
      onSuccess: () => { setSelectedEntry(null); toast.success("Class removed from timetable"); },
      onError: () => toast.error("Failed to delete"),
    });
  };

  const handleEdit = () => {
    if (!editEntry.courseId || !editEntry.location) {
      toast.error("Please fill in all fields");
      return;
    }
    if (editEntry.endTime <= editEntry.startTime) {
      toast.error("End time must be after start time");
      return;
    }
    updateSlot.mutate(editEntry, {
      onSuccess: () => { setShowEdit(false); toast.success("Class updated successfully!"); },
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : "Failed to update class";
        toast.error(message);
      },
    });
  };

  const openEdit = (entry: TimetableSlot) => {
    setEditEntry({
      id: entry.id,
      courseId: entry.course?.id ?? 0,
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime.substring(0, 5),
      endTime: entry.endTime.substring(0, 5),
      location: entry.location || "",
      notes: entry.notes || "",
      meetingLink: entry.meetingLink || "",
    });
    setSelectedEntry(null);
    setShowEdit(true);
  };

  const CELL_H = 32; // px per 30-min row
  const START_HOUR = 7; // first hour in the grid

  if (isLoading) {
    return <div className="p-6 text-muted-foreground">Loading timetable...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Timetable</h1>
          <p className="text-muted-foreground mt-1">Schedule and manage your weekly classes</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === "week" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}>
              Week
            </button>
            <button onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}>
              List
            </button>
          </div>
          <Button onClick={() => setShowAdd(true)} className="gradient-cta text-primary-foreground">
            <Plus className="h-4 w-4 mr-1" /> Schedule Class
          </Button>
        </div>
      </div>

      {viewMode === "week" ? (
        /* Weekly Grid View — absolute-positioned events */
        <div className="rounded-xl border border-border bg-card shadow-card overflow-auto">
          <div className="min-w-[900px]">
            {/* Header */}
            <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border">
              <div className="p-3 text-xs font-medium text-muted-foreground border-r border-border">Time</div>
              {days.map((day) => (
                <div key={day} className="p-3 text-xs font-semibold text-foreground text-center border-r border-border last:border-r-0">
                  {day}
                </div>
              ))}
            </div>
            {/* Body with relative container */}
            <div className="relative">
              {/* Background rows — each row is 30 min */}
              {timeSlots.map((ts, tIdx) => {
                const isHour = ts.endsWith(":00");
                return (
                  <div key={ts} className={`grid grid-cols-[80px_repeat(7,1fr)] border-b border-border last:border-b-0 ${!isHour ? 'border-dashed' : ''}`} style={{ height: CELL_H }}>
                    <div className="p-1 text-[10px] text-muted-foreground border-r border-border flex items-start justify-end pr-2">
                      {isHour ? formatTime(ts) : ''}
                    </div>
                    {dayEnums.map((dayEnum) => (
                      <div key={dayEnum} className="border-r border-border last:border-r-0 hover:bg-accent/30 transition-colors cursor-pointer"
                        onClick={() => {
                          setNewEntry({ ...newEntry, dayOfWeek: dayEnum, startTime: ts, endTime: timeSlots[Math.min(tIdx + 2, timeSlots.length - 1)] });
                          setShowAdd(true);
                        }} />
                    ))}
                  </div>
                );
              })}
              {/* Event overlay — covers only the day columns */}
              <div className="absolute top-0 bottom-0 right-0 pointer-events-none" style={{ left: 80 }}>
                {timetable.map((entry) => {
                  const startH = parseInt(entry.startTime.substring(0, 2), 10);
                  const startM = parseInt(entry.startTime.substring(3, 5), 10);
                  const endH = parseInt(entry.endTime.substring(0, 2), 10);
                  const endM = parseInt(entry.endTime.substring(3, 5), 10);
                  const top = ((startH - START_HOUR) + startM / 60) * CELL_H * 2;
                  const height = Math.max(((endH - START_HOUR) + endM / 60) * CELL_H * 2 - top, 24);
                  const dayIdx = dayToGridIndex(entry.dayOfWeek);
                  const colPct = 100 / 7;
                  return (
                    <motion.div key={entry.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      className="absolute rounded-lg bg-blue-500/10 border border-blue-500/30 p-2 cursor-pointer hover:shadow-md transition-shadow pointer-events-auto z-10"
                      style={{
                        top,
                        height,
                        left: `calc(${dayIdx * colPct}% + 2px)`,
                        width: `calc(${colPct}% - 4px)`,
                      }}
                      onClick={() => setSelectedEntry(entry)}>
                      <p className="text-xs font-semibold text-blue-500 truncate">{entry.course?.title ?? "Untitled"}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{formatTime(entry.startTime)} - {formatTime(entry.endTime)}</p>
                      {height >= 60 && <p className="text-[10px] text-muted-foreground">{entry.location}</p>}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="space-y-2">
          {dayEnums.map((dayEnum, di) => {
            const dayEntries = timetable.filter((e) => e.dayOfWeek === dayEnum)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));
            if (dayEntries.length === 0) return null;
            return (
              <motion.div key={dayEnum} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
                <div className="px-5 py-3 bg-secondary border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">{days[di]}</h3>
                </div>
                <div className="divide-y divide-border">
                  {dayEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between px-5 py-3 hover:bg-accent/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-muted-foreground w-36 flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{entry.course?.title ?? "Untitled"}</p>
                          <p className="text-xs text-muted-foreground">{entry.location || "No location"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(entry)} className="text-muted-foreground hover:text-foreground h-8 w-8 p-0">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(entry.id)} className="text-destructive h-8 w-8 p-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Entry Detail Dialog */}
      <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">{selectedEntry?.course?.title}</DialogTitle></DialogHeader>
          {selectedEntry && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Day:</span> <span className="text-foreground ml-1">{dayDisplayName(selectedEntry.dayOfWeek)}</span></div>
                <div><span className="text-muted-foreground">Time:</span> <span className="text-foreground ml-1">{formatTime(selectedEntry.startTime)} - {formatTime(selectedEntry.endTime)}</span></div>
                <div><span className="text-muted-foreground">Location:</span> <span className="text-foreground ml-1">{selectedEntry.location || "–"}</span></div>
                {selectedEntry.notes && <div><span className="text-muted-foreground">Notes:</span> <span className="text-foreground ml-1">{selectedEntry.notes}</span></div>}
                {selectedEntry.meetingLink && <div className="col-span-2"><span className="text-muted-foreground">Meeting Link:</span> <a href={selectedEntry.meetingLink} target="_blank" rel="noreferrer" className="text-primary ml-1 underline inline-flex items-center gap-1"><Link2 className="h-3 w-3" />{selectedEntry.meetingLink}</a></div>}
              </div>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(selectedEntry)} className="flex-1">
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedEntry.id)} className="flex-1">
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Class Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">Schedule a Class</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Course</label>
              <Select value={newEntry.courseId ? String(newEntry.courseId) : ""} onValueChange={(v) => setNewEntry({ ...newEntry, courseId: Number(v) })}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select a course" /></SelectTrigger>
                <SelectContent>
                  {courses.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Day</label>
                <Select value={newEntry.dayOfWeek} onValueChange={(v) => setNewEntry({ ...newEntry, dayOfWeek: v })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{dayEnums.map((d, i) => <SelectItem key={d} value={d}>{days[i]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Location</label>
                <Input value={newEntry.location || ""} onChange={(e) => setNewEntry({ ...newEntry, location: e.target.value })}
                  placeholder="e.g., Room A / Online" className="bg-secondary border-border" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Start Time</label>
                <Select value={newEntry.startTime} onValueChange={(v) => setNewEntry({ ...newEntry, startTime: v })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{timeSlots.map((t) => <SelectItem key={t} value={t}>{formatTime(t)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">End Time</label>
                <Select value={newEntry.endTime} onValueChange={(v) => setNewEntry({ ...newEntry, endTime: v })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{timeSlots.map((t) => <SelectItem key={t} value={t}>{formatTime(t)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Notes (optional)</label>
              <Input value={newEntry.notes || ""} onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                placeholder="e.g., Revision topic" className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Meeting Link (optional)</label>
              <Input value={newEntry.meetingLink || ""} onChange={(e) => setNewEntry({ ...newEntry, meetingLink: e.target.value })}
                placeholder="https://zoom.us/j/..." className="bg-secondary border-border" />
            </div>
            <Button onClick={handleAdd} disabled={createSlot.isPending} className="w-full gradient-cta text-primary-foreground">
              {createSlot.isPending ? "Scheduling..." : "Schedule Class"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Class Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">Edit Scheduled Class</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Course</label>
              <Select value={editEntry.courseId ? String(editEntry.courseId) : ""} onValueChange={(v) => setEditEntry({ ...editEntry, courseId: Number(v) })}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select a course" /></SelectTrigger>
                <SelectContent>
                  {courses.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Day</label>
                <Select value={editEntry.dayOfWeek} onValueChange={(v) => setEditEntry({ ...editEntry, dayOfWeek: v })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{dayEnums.map((d, i) => <SelectItem key={d} value={d}>{days[i]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Location</label>
                <Input value={editEntry.location || ""} onChange={(e) => setEditEntry({ ...editEntry, location: e.target.value })}
                  placeholder="e.g., Room A / Online" className="bg-secondary border-border" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Start Time</label>
                <Select value={editEntry.startTime} onValueChange={(v) => setEditEntry({ ...editEntry, startTime: v })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{timeSlots.map((t) => <SelectItem key={t} value={t}>{formatTime(t)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">End Time</label>
                <Select value={editEntry.endTime} onValueChange={(v) => setEditEntry({ ...editEntry, endTime: v })}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{timeSlots.map((t) => <SelectItem key={t} value={t}>{formatTime(t)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Notes (optional)</label>
              <Input value={editEntry.notes || ""} onChange={(e) => setEditEntry({ ...editEntry, notes: e.target.value })}
                placeholder="e.g., Revision topic" className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Meeting Link (optional)</label>
              <Input value={editEntry.meetingLink || ""} onChange={(e) => setEditEntry({ ...editEntry, meetingLink: e.target.value })}
                placeholder="https://zoom.us/j/..." className="bg-secondary border-border" />
            </div>
            <Button onClick={handleEdit} disabled={updateSlot.isPending} className="w-full gradient-cta text-primary-foreground">
              {updateSlot.isPending ? "Updating..." : "Update Class"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
