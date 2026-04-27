import { motion } from "framer-motion";
import { Bell, CheckCircle2 } from "lucide-react";
import { useAnnouncementsForStudent } from "@/lib/api";

export default function StudentAnnouncementsSection() {
    const userId = Number(localStorage.getItem("authUserId")) || undefined;
    const { data: announcements = [], isLoading } = useAnnouncementsForStudent(userId);

    const announcementsByCourse = announcements.reduce(
        (acc, announcement) => {
            const courseId = announcement.courseId;
            if (!acc[courseId]) {
                acc[courseId] = { courseName: announcement.courseName, items: [] };
            }
            acc[courseId].items.push(announcement);
            return acc;
        },
        {} as Record<number, { courseName: string; items: typeof announcements }>
    );

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl bg-card border border-border p-6 shadow-card">
            <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" /> Announcements
            </h2>

            {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading announcements...</p>
            ) : announcements.length === 0 ? (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">No announcements yet. Check back later!</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(announcementsByCourse).map(([_, courseData]) => (
                        <div key={courseData.courseName} className="space-y-3">
                            <h3 className="text-sm font-medium text-foreground">{courseData.courseName}</h3>
                            <div className="space-y-2 pl-4 border-l-2 border-primary/30">
                                {courseData.items.map((announcement) => (
                                    <motion.div
                                        key={announcement.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="group p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">
                                                    {announcement.title}
                                                </h4>
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{announcement.content}</p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <p className="text-xs text-muted-foreground">{announcement.teacherName}</p>
                                                    <p className="text-xs text-muted-foreground">{new Date(announcement.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
