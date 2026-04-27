import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Send, Trash2, Plus, X } from "lucide-react";
import { useCourses, useAnnouncementsByTeacher, useCreateAnnouncement, useDeleteAnnouncement } from "@/lib/api";

export default function AnnouncementsSection() {
  const teacherId = Number(localStorage.getItem("authUserId")) || 0;
  const { data: courses = [], isLoading: loadingCourses } = useCourses();
  const { data: announcements = [], isLoading: loadingAnnouncements, refetch } = useAnnouncementsByTeacher(teacherId);
  const createAnnouncementMutation = useCreateAnnouncement();
  const deleteAnnouncementMutation = useDeleteAnnouncement();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !title.trim() || !content.trim()) return;

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
      setIsOpen(false);
      refetch();
    } catch (error) {
      console.error("Failed to create announcement:", error);
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
        refetch();
      } catch (error) {
        console.error("Failed to delete announcement:", error);
      }
    }
  };

  const selectedCourseName = courses.find((c) => c.id === selectedCourse)?.title || "";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl bg-card border border-border p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" /> Announcements
        </h2>
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Announcement
        </button>
      </div>

      {/* Create Announcement Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border border-border rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-display font-semibold text-foreground">Create Announcement</h3>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              {/* Course Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Select Course</label>
                <select
                  value={selectedCourse || ""}
                  onChange={(e) => setSelectedCourse(Number(e.target.value) || null)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-secondary text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- Choose a course --</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter announcement title"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-secondary text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Message</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter announcement message"
                  rows={6}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-secondary text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedCourse || !title.trim() || !content.trim() || isSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-4 w-4" /> {isSubmitting ? "Sending..." : "Send Announcement"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Active Announcements */}
      {loadingAnnouncements ? (
        <p className="text-sm text-muted-foreground">Loading announcements...</p>
      ) : announcements.length === 0 ? (
        <p className="text-sm text-muted-foreground">No announcements yet. Create one to get started!</p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="p-4 rounded-lg bg-secondary border border-border/50 hover:border-border transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground text-sm truncate">{announcement.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{announcement.courseName}</p>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{announcement.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(announcement.createdAt).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => handleDeleteAnnouncement(announcement.id)}
                  className="flex-shrink-0 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
