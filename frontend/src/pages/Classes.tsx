import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, Brain, Clock, ChevronDown, Globe, Users, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { get } from "@/lib/api-client";
import type { Course, TimetableSlot } from "@/lib/api";
import { dayDisplayName, formatTime } from "@/lib/api";

interface CourseWithSchedule extends Course {
  day?: string;
  time?: string;
}

const years = ["All Years", "2026 A/L", "2027 A/L", "2028 A/L"];
const types = ["All Types", "Theory", "Revision", "Paper"];

const badgeColors = [
  "bg-primary/15 text-primary",
  "bg-info/15 text-info",
  "bg-success/15 text-success",
  "bg-warning/15 text-warning",
];

export default function Classes() {
  const [year, setYear] = useState("All Years");
  const [type, setType] = useState("All Types");
  const [courses, setCourses] = useState<CourseWithSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const courseList = await get<Course[]>("/api/courses");
        let slots: TimetableSlot[] = [];
        try {
          slots = await get<TimetableSlot[]>("/api/timetable");
        } catch {
          // timetable may not be available
        }
        const slotMap = new Map<number, TimetableSlot>();
        for (const s of slots) {
          if (!slotMap.has(s.course.id)) slotMap.set(s.course.id, s);
        }
        setCourses(
          courseList.map((c) => {
            const slot = slotMap.get(c.id);
            return {
              ...c,
              day: slot ? dayDisplayName(slot.dayOfWeek) : undefined,
              time: slot ? formatTime(slot.startTime) : undefined,
            };
          })
        );
      } catch {
        setCourses([]);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  const filtered = courses.filter((c) => {
    if (year !== "All Years" && c.batch !== year) return false;
    if (type !== "All Types" && c.type !== type) return false;
    return true;
  });

  const clearFilters = () => { setYear("All Years"); setType("All Types"); };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="font-display text-lg font-bold text-foreground">Phy6 Master</span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {[
            { label: "Home", to: "/" },
            { label: "About", to: "/about" },
            { label: "Classes", to: "/classes" },
            { label: "Results", to: "/#results" },
            { label: "Contact", to: "/#contact" },
          ].map((l) => (
            <Link key={l.label} to={l.to}
              className={`px-3 py-2 text-sm font-medium transition-colors ${l.label === "Classes" ? "text-primary" : "text-foreground hover:text-primary"}`}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link to="/signup"><Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-sm">Sign Up</Button></Link>
          <Link to="/signin"><Button className="gradient-cta text-primary-foreground text-sm font-semibold">Sign In</Button></Link>
        </div>
      </nav>

      {/* Header */}
      <section className="gradient-hero">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-display text-4xl md:text-5xl font-bold text-foreground">
            Our <span className="text-gradient">Classes</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Interactive and results-driven A/L Physics classes. Available online and in-person, ensuring quality education for every student.
          </motion.p>
        </div>
      </section>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-wrap items-center gap-4 rounded-xl bg-card border border-border p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Year</span>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Type</span>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={clearFilters} className="text-sm">Clear All</Button>
          <span className="ml-auto text-sm text-muted-foreground">Showing {filtered.length} of {courses.length} courses</span>
        </div>
      </div>

      {/* Course Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-40 animate-pulse" />
            <p className="text-lg font-medium">Loading classes...</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-glow transition-shadow cursor-pointer group">
              <div className="aspect-[4/3] bg-accent flex items-center justify-center relative overflow-hidden">
                {c.imageUrl ? (
                  <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-info/10 to-transparent" />
                    <Brain className="h-16 w-16 text-muted-foreground/50 group-hover:scale-110 transition-transform" />
                  </>
                )}
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-1.5">
                  {c.subject && <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeColors[0]}`}>{c.subject}</span>}
                  {c.type && <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeColors[1]}`}>{c.type}</span>}
                  {c.batch && <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeColors[2]}`}>{c.batch}</span>}
                </div>
                <h3 className="mt-3 font-display text-sm font-semibold text-foreground leading-snug">{c.title}</h3>
                {c.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{c.description}</p>}
                {c.day && (
                  <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> {c.day}{c.time ? ` | ${c.time}` : ""}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium">No courses match your filters</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>Clear Filters</Button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="font-display text-lg font-bold text-primary">Phy6 Master</span>
            </div>
            <p className="text-sm text-muted-foreground">Making quality education accessible and personalized for everyone, everywhere through AI innovation.</p>
          </div>
          <div>
            <h4 className="font-display font-bold text-xs tracking-wider text-foreground mb-4">PRODUCTS</h4>
            {[{ label: "Registration", to: "/signup" }, { label: "Classes", to: "/classes" }, { label: "My Profile", to: "/signin" }].map((l) => (
              <Link key={l.label} to={l.to} className="block text-sm text-muted-foreground mb-2 hover:text-primary">{l.label}</Link>
            ))}
          </div>
          <div>
            <h4 className="font-display font-bold text-xs tracking-wider text-foreground mb-4">RESOURCES</h4>
            {[{ label: "Home", to: "/" }, { label: "About Us", to: "/#about" }, { label: "Contact", to: "/#contact" }].map((l) => (
              <Link key={l.label} to={l.to} className="block text-sm text-muted-foreground mb-2 hover:text-primary">{l.label}</Link>
            ))}
          </div>
          <div>
            <h4 className="font-display font-bold text-xs tracking-wider text-foreground mb-4">OTHER</h4>
            {[{ label: "Privacy Policy", to: "#" }, { label: "Refund Policy", to: "#" }, { label: "Terms", to: "#" }].map((l) => (
              <Link key={l.label} to={l.to} className="block text-sm text-muted-foreground mb-2 hover:text-primary">{l.label}</Link>
            ))}
          </div>
        </div>
        <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">© 2024 Phy6 Master. All rights reserved.</div>
      </footer>
    </div>
  );
}
