import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, Users, Target, Award, BookOpen, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import teacherPhoto from "@/assets/teacher-photo.jpeg";

const stats = [
  { label: "Students Taught", value: "500+" },
  { label: "Years Experience", value: "10+" },
  { label: "A/L Distinctions", value: "200+" },
  { label: "Online Classes", value: "4" },
];

const values = [
  { icon: Target, title: "Results-Driven", desc: "Every lesson is crafted with exam success in mind, focusing on past papers and model answers." },
  { icon: BookOpen, title: "Deep Understanding", desc: "We go beyond memorization — students learn the 'why' behind every Physics concept." },
  { icon: Users, title: "Personal Attention", desc: "Small batch sizes ensure every student gets the guidance they need to excel." },
  { icon: Award, title: "Proven Track Record", desc: "Consistently producing top-performing A/L Physics students year after year." },
];

export default function About() {
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
              className={`px-3 py-2 text-sm font-medium transition-colors ${l.label === "About" ? "text-primary" : "text-foreground hover:text-primary"}`}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link to="/signup"><Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-sm">Sign Up</Button></Link>
          <Link to="/signin"><Button className="gradient-cta text-primary-foreground text-sm font-semibold">Sign In</Button></Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="gradient-hero">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl md:text-5xl font-bold text-foreground">
            About <span className="text-gradient">Phy6 Master</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mt-4 text-muted-foreground max-w-2xl mx-auto text-lg">
            Empowering A/L Physics students with expert guidance, structured learning, and a passion for excellence.
          </motion.p>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-border bg-card p-6 text-center">
              <p className="font-display text-3xl font-bold text-primary">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Teacher Section */}
      <section className="max-w-7xl mx-auto px-6 py-8 pb-20">
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex flex-col md:flex-row items-center gap-0">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="md:w-80 shrink-0">
              <img src={teacherPhoto} alt="Physics Teacher" className="w-full h-72 md:h-full object-cover object-top" />
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="p-8 md:p-12">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/15 text-primary">OUR TEACHER</span>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mt-3">
                A Dedicated Physics Educator
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                With over 10 years of experience teaching A/L Physics, our instructor brings a unique blend of academic rigor and practical teaching methods. Having personally mentored hundreds of students to achieve top results, the approach at Phy6 Master is always student-first.
              </p>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Classes are designed to break down complex Physics concepts into simple, memorable steps — making even the hardest topics approachable for every student. The mission is simple: help every student understand, not just memorize.
              </p>
              <Link to="/classes" className="mt-6 inline-block">
                <Button className="gradient-cta text-primary-foreground font-semibold">Explore Classes</Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">Our Values</h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">What sets Phy6 Master apart from the rest.</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v, i) => (
            <motion.div key={v.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-border bg-card p-6">
              <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center mb-4">
                <v.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground">{v.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="rounded-2xl bg-secondary p-10 text-center border border-border">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">Ready to join Phy6 Master?</h2>
          <p className="mt-3 text-muted-foreground">Start your journey to A/L Physics success today.</p>
          <Link to="/signup" className="mt-6 inline-block">
            <Button className="gradient-cta text-primary-foreground font-display font-bold px-10 py-3 text-lg rounded-xl">Register Now</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="font-display text-lg font-bold text-primary">Phy6 Master</span>
            </div>
            <p className="text-sm text-muted-foreground">Making quality education accessible and personalized for everyone, everywhere.</p>
            <div className="flex gap-3 mt-4">
              <Globe className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer" />
              <Users className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer" />
            </div>
          </div>
          <div>
            <h4 className="font-display font-bold text-xs tracking-wider text-foreground mb-4">PRODUCTS</h4>
            {[{ label: "Registration", to: "/signup" }, { label: "Classes", to: "/classes" }, { label: "My Profile", to: "/signin" }].map((l) => (
              <Link key={l.label} to={l.to} className="block text-sm text-muted-foreground mb-2 hover:text-primary">{l.label}</Link>
            ))}
          </div>
          <div>
            <h4 className="font-display font-bold text-xs tracking-wider text-foreground mb-4">RESOURCES</h4>
            {[{ label: "Home", to: "/" }, { label: "About Us", to: "/about" }, { label: "Contact", to: "/#contact" }].map((l) => (
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
