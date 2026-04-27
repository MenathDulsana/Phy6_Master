import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Send, Trash2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useCourses, useAnnouncementsByTeacher, useCreateAnnouncement, useDeleteAnnouncement } from "@/lib/api";

export default function TeacherAnnouncementsPage() {
  const teacherId = Number(localStorage.getItem("authUserId")) || 0;
  const { data: courses = [], isLoading: loadingCourses, isError: coursesError } = useCourses();
  const { data: announcements = [], isLoading: loadingAnnouncements, refetch } = useAnnouncementsByTeacher(teacherId);
  const createAnnouncementMutation = useCreateAnnouncement();
  const deleteAnnouncementMutation = useDeleteAnnouncement();

  // Show courses owned by this teacher, OR courses without a teacher assigned (legacy)
  const teacherCourses = courses.filter((c) => c.teacher?.id === teacherId || !c.teacher);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !title.trim() || !content.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await createAnnouncementMutation.mutateAsync({
        courseId: selectedCourse,
        teacherId,
        title,
        content,
      });
      setTitle("");
      setContent("");
      setSelectedCourse(null);
      setIsDialogOpen(false);
      toast.success("Announcement created successfully!");
      refetch();
    } catch (error: unknown) {
      console.error("Failed to create announcement:", error);
      const message = error instanceof Error ? error.message : "Failed to create announcement";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId: number) => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      try {
        await deleteAnnouncementMutation.mutateAsync({
          id: announcementId,
          teacherId,
        });
        toast.success("Announcement deleted");
        refetch();
      } catch (error: unknown) {
        console.error("Failed to delete announcement:", error);
        const message = error instanceof Error ? error.message : "Failed to delete announcement";
        toast.error(message);
      }
    }
  };

  const courseDetails = teacherCourses.find((c) => c.id === selectedCourse);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" /> Announcements
          </h1>
          <p className="text-muted-foreground mt-1">Create and manage class announcements</p>
        </div>
        <button
          type="button"
          onClick={() => setIsDialogOpen(true)}
          disabled={teacherCourses.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="h-5 w-5" /> New Announcement
        </button>
      </div>

      {/* Create Announcement Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display font-semibold text-foreground">Create Announcement</h3>
              <button onClick={() => setIsDialogOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-5">
              {/* Course Selection */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Select Target Class</label>
                <select
                  value={selectedCourse || ""}
                  onChange={(e) => setSelectedCourse(Number(e.target.value) || null)}
                  disabled={loadingCourses}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-secondary text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                >
                  <option value="">{loadingCourses ? "Loading classes..." : "-- Choose a class --"}</option>
                  {teacherCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title} {course.batch && `(${course.batch})`}
                    </option>
                  ))}
                </select>
                {coursesError && (
                  <p className="text-xs text-destructive mt-2">
                    Failed to load classes. Please close this dialog and try again.
                  </p>
                )}
                {!loadingCourses && !coursesError && teacherCourses.length === 0 && (
                  <p className="text-xs text-destructive mt-2">
                    You have no classes assigned. Please create a class first in the Classes section.
                  </p>
                )}
                {courseDetails && (
                  <p className="text-xs text-muted-foreground mt-2">
                    This announcement will be visible to all {courseDetails.batch} students enrolled in this class.
                  </p>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Announcement Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Important: Class Schedule Change"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-secondary text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Announcement Message</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your announcement here..."
                  rows={8}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-secondary text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {content.length} / 2000 characters
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="px-4 py-2.5 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedCourse || !title.trim() || !content.trim() || isSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <Send className="h-4 w-4" /> {isSubmitting ? "Sending..." : "Send Announcement"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Announcements Grid */}
      {loadingAnnouncements ? (
        <div className="rounded-xl bg-card border border-border p-8 text-center">
          <p className="text-muted-foreground">Loading announcements...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="rounded-xl bg-card border border-border p-8 text-center">
          <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">No announcements yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {announcements.map((announcement, index) => (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-lg border border-border bg-card p-5 hover:border-primary/50 transition-colors shadow-card"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{announcement.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{announcement.courseName}</p>
                </div>
                <button
                  onClick={() => handleDeleteAnnouncement(announcement.id)}
                  className="flex-shrink-0 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{announcement.content}</p>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
                <span>Posted {new Date(announcement.createdAt).toLocaleDateString()}</span>
                <span className="px-2 py-1 rounded bg-primary/10 text-primary">{announcement.courseName}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
