import { motion } from "framer-motion";
import { Bell, CheckCircle2 } from "lucide-react";
import { useAnnouncementsByCourse } from "@/lib/api";

const fadeIn = { initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 } };

export default function CourseAnnouncementsSection({ courseId }: { courseId: number }) {
  const { data: announcements = [], isLoading } = useAnnouncementsByCourse(courseId);

  return (
    <motion.div {...fadeIn} className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
      <div className="p-6">
        <h2 className="font-display font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" /> Course Announcements
        </h2>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading announcements...</p>
        ) : announcements.length === 0 ? (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50">
            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
            <p className="text-sm text-muted-foreground">No announcements for this course yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors border border-border/50 hover:border-border"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground text-sm">{announcement.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{announcement.content}</p>
                    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                      <span>{announcement.teacherName}</span>
                      <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
