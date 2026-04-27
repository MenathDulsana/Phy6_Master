import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useStudentCourses, useMaterials, getMaterialDownloadUrl } from "@/lib/api";
import { get } from "@/lib/api-client";

export default function Resources() {
  const userId = Number(localStorage.getItem("authUserId")) || undefined;
  const { data: courses = [], isLoading: loadingCourses } = useStudentCourses(userId);
  const [selectedCourseId, setSelectedCourseId] = useState<number | undefined>();
  const { data: materials = [], isLoading: loadingMaterials } = useMaterials(selectedCourseId, userId);
  const [search, setSearch] = useState("");

  const handleSelectCourse = async (value: string) => {
    const courseId = Number(value);
    if (!userId || !courseId) {
      setSelectedCourseId(courseId || undefined);
      return;
    }

    try {
      const access = await get<{ canAccess: boolean; status: string; message: string }>(
        `/api/student/enrollments/access/${userId}/${courseId}`
      );
      if (!access.canAccess) {
        toast.error(access.message);
        setSelectedCourseId(undefined);
        return;
      }
      setSelectedCourseId(courseId);
    } catch {
      toast.error("Unable to verify class access at the moment.");
      setSelectedCourseId(undefined);
    }
  };

  const filtered = materials.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="font-display text-2xl font-bold text-foreground">Resources</motion.h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search resources..." className="pl-10 bg-secondary border-border" />
        </div>
        <Select value={selectedCourseId ? String(selectedCourseId) : ""} onValueChange={handleSelectCourse}>
          <SelectTrigger className="w-64 bg-secondary border-border"><SelectValue placeholder="Select a course" /></SelectTrigger>
          <SelectContent>
            {courses.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loadingCourses ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : !selectedCourseId ? (
        <div className="rounded-xl border border-border bg-card p-10 shadow-card text-center">
          <p className="text-muted-foreground">Select a course above to view its resources.</p>
        </div>
      ) : loadingMaterials ? (
        <p className="text-sm text-muted-foreground">Loading materials...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 shadow-card text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No resources available for this course yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-glow transition-shadow">
              <div className="flex items-start">
                <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center"><FileText className="h-5 w-5 text-primary" /></div>
              </div>
              <h3 className="mt-3 font-display font-semibold text-sm text-foreground">{r.title}</h3>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <span className="px-2 py-0.5 rounded bg-accent text-accent-foreground">{r.type}</span>
                {r.lesson && <span>· {r.lesson.title}</span>}
              </div>
              <div className="flex gap-2 mt-4">
                {r.type === "VIDEO" ? (
                  <a
                    href={getMaterialDownloadUrl(r.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-foreground/70 bg-transparent text-foreground transition-colors hover:border-foreground hover:bg-muted/30"
                    aria-label="Play video"
                  >
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
                ) : (
                  <a href={getMaterialDownloadUrl(r.id)} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button size="sm" className="w-full gradient-cta text-primary-foreground">
                      <Download className="h-3 w-3 mr-1" /> Download
                    </Button>
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
