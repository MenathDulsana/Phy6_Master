import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, Brain, Users, Mail, ChevronDown, Globe, Phone, MapPin, Quote } from "lucide-react";
import teacherPhoto from "@/assets/teacher-full.png";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { get } from "@/lib/api-client";
import type { Course, TimetableSlot } from "@/lib/api";
import { dayDisplayName, formatTime } from "@/lib/api";

// Navigation handled inline below

const testimonials = [
  { name: "Kasun Perera", batch: "2025 A/L", text: "Phy6 Master completely changed how I understand Physics. The teaching style is very easy to follow and exam-oriented." },
  { name: "Nimali Fernando", batch: "2024 A/L", text: "I scored an A for Physics thanks to the structured approach and constant support. Highly recommend to all A/L students!" },
  { name: "Tharindu Silva", batch: "2025 A/L", text: "The online classes are just as effective as in-person. Sir explains even the hardest concepts in a simple way." },
  { name: "Sachini Jayawardena", batch: "2024 A/L", text: "Best Physics class I've attended. The revision sessions and past paper discussions were extremely helpful." },
];

interface CourseWithSchedule extends Course {
  day?: string;
  time?: string;
}

export default function Landing() {
  const [courses, setCourses] = useState<CourseWithSchedule[]>([]);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const courseList = await get<Course[]>("/api/courses");
        let slots: TimetableSlot[] = [];
        try {
          slots = await get<TimetableSlot[]>("/api/timetable");
        } catch {
          // timetable may not exist yet
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
      }
    }
    fetchCourses();
  }, []);

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
            { label: "Classes", to: "/classes" },
            { label: "Sign Up", to: "/signup" },
            { label: "Sign In", to: "/signin" },
          ].map((l) => (
            <Link key={l.label} to={l.to} className="px-3 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors">{l.label}</Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link to="/signup"><Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-sm">Sign Up</Button></Link>
          <Link to="/signin"><Button className="gradient-cta text-primary-foreground text-sm font-semibold">Sign In</Button></Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="gradient-hero relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 flex flex-col md:flex-row items-center gap-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex-1">
            <h1 className="font-display text-5xl md:text-6xl font-bold text-foreground leading-tight">
              Enroll Now –<br /><span className="text-gradient">A/L 2027</span><br />Batch
            </h1>
            <p className="mt-6 text-muted-foreground text-lg max-w-md">
              Get a head start with expert guidance. Join the leading A/L Physics classes, online or in person.
            </p>
            <Link to="/signup">
              <Button className="mt-8 gradient-cta text-primary-foreground font-semibold px-8 py-3 text-base">Register Now</Button>
            </Link>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }} className="flex-1 flex justify-center">
            <div className="w-full max-w-lg rounded-2xl overflow-hidden border-2 border-primary/20 shadow-[0_0_40px_rgba(234,179,8,0.12)]">
              <img src={teacherPhoto} alt="Phy6 Master Teacher" className="w-full h-full object-cover" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Classes */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">Our Classes</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Interactive and results-driven A/L Physics classes. Available online and in-person, ensuring quality education for every student.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {courses.length === 0 ? (
            <p className="col-span-full text-center text-muted-foreground">No classes available yet.</p>
          ) : (
            courses.map((c, i) => (
              <Link to="/classes" key={c.id}>
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="rounded-xl border border-border bg-card p-4 hover:shadow-glow hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                  <div className="aspect-square rounded-lg bg-accent flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors overflow-hidden">
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover" />
                    ) : (
                      <Brain className="h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {c.subject && (
                      <span className="text-xs font-bold px-2 py-1 rounded bg-primary text-primary-foreground">{c.subject.toUpperCase()}</span>
                    )}
                    {c.type && (
                      <span className="text-xs font-bold px-2 py-1 rounded bg-blue-500/15 text-blue-600">{c.type}</span>
                    )}
                    {c.batch && (
                      <span className="text-xs font-bold px-2 py-1 rounded bg-green-500/15 text-green-600">{c.batch}</span>
                    )}
                  </div>
                  <h3 className="font-display text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{c.title}</h3>
                  {c.day && c.time && (
                    <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-destructive" /> {c.day} · {c.time}
                    </p>
                  )}
                </motion.div>
              </Link>
            ))
          )}
        </div>
        <div className="mt-10 text-center">
          <Link to="/classes">
            <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold px-8 py-3 text-base rounded-xl">
              Explore All Classes <span className="ml-1">↗</span>
            </Button>
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">What Students Say</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">Hear from students who have transformed their A/L Physics results.</p>
        </motion.div>

        <Carousel opts={{ loop: true }} plugins={[Autoplay({ delay: 4000, stopOnInteraction: false })]} className="relative px-12">
          <CarouselContent>
            {testimonials.map((t, i) => (
              <CarouselItem key={i}>
                <div className="rounded-xl border border-border bg-card p-8 text-center">
                  <Quote className="h-8 w-8 text-primary mx-auto mb-4 opacity-60" />
                  <p className="text-foreground text-base md:text-lg italic leading-relaxed">"{t.text}"</p>
                  <div className="mt-6">
                    <p className="font-display font-bold text-foreground">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.batch}</p>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="rounded-2xl bg-secondary p-10 md:p-14 text-center border border-border">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">Ready to transform your learning experience?</h2>
          <p className="mt-4 text-muted-foreground">Join hundreds of A/L Physics students who have already improved their results with expert guidance.</p>
          <Link to="/signup" className="mt-8 inline-block">
            <Button className="gradient-cta text-primary-foreground font-display font-bold px-12 py-4 text-xl rounded-xl">Register Now</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-10">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="font-display text-lg font-bold text-primary">Phy6 Master</span>
            </div>
          </div>
          <div>
            <h4 className="font-display font-bold text-xs tracking-wider text-foreground mb-4">PLATFORM</h4>
            {[
              { label: "Register", to: "/signup" },
              { label: "All Classes", to: "/classes" },
              { label: "Sign In", to: "/signin" },
            ].map((l) => <Link key={l.label} to={l.to} className="block text-sm text-muted-foreground mb-2 hover:text-primary">{l.label}</Link>)}
          </div>
          <div>
            <h4 className="font-display font-bold text-xs tracking-wider text-foreground mb-4">NAVIGATE</h4>
            {[
              { label: "Home", to: "/" },
              { label: "Classes", to: "/classes" },
            ].map((l) => <Link key={l.label} to={l.to} className="block text-sm text-muted-foreground mb-2 hover:text-primary">{l.label}</Link>)}
          </div>
          <div>
            <h4 className="font-display font-bold text-xs tracking-wider text-foreground mb-4">OTHER</h4>
            {[
              { label: "Privacy Policy", to: "#" },
              { label: "Refund Policy", to: "#" },
              { label: "Terms", to: "#" },
            ].map((l) => <Link key={l.label} to={l.to} className="block text-sm text-muted-foreground mb-2 hover:text-primary">{l.label}</Link>)}
          </div>
        </div>
        <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
          © 2026 Phy6 Master. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
