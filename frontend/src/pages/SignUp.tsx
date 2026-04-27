import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, User, Mail, Lock, ShieldCheck, Eye, EyeOff, ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { signUp } from "@/lib/auth-api";

export default function SignUp() {
  const [form, setForm] = useState({ name: "", email: "", username: "", phoneNumber: "", password: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState(false);
  const [agree, setAgree] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.username || !form.password || !form.confirmPassword) { toast.error("Please fill in all fields"); return; }
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (form.password !== form.confirmPassword) { toast.error("Passwords do not match"); return; }
    if (form.phoneNumber && form.phoneNumber.length !== 10) { toast.error("Phone number must be 10 digits"); return; }
    if (!agree) { toast.error("Please agree to the terms"); return; }

    setIsSubmitting(true);
    try {
      const response = await signUp(form.name.trim(), form.email.trim(), form.username.trim(), form.phoneNumber.trim(), form.password);

      localStorage.setItem("authRole", response.role);
      localStorage.setItem("authName", response.name || "");
      localStorage.setItem("authUsername", response.username);
      localStorage.setItem("authUserId", String(response.userId));

      toast.success(response.message || "Account created successfully!");
      navigate("/student/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create account";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto border-b border-border">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg gradient-cta flex items-center justify-center"><Zap className="h-4 w-4 text-primary-foreground" /></div>
          <span className="font-display text-lg font-bold text-foreground">Phy6 Master</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:block">Already have an account?</span>
          <Link to="/signin"><Button variant="outline" className="border-border text-foreground text-sm">Sign In</Button></Link>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-12">

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-card border border-border p-8 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={form.name} onChange={set("name")} className="pl-10 bg-secondary border-border" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={form.email} onChange={set("email")} type="email" className="pl-10 bg-secondary border-border" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Username</label>
              <Input value={form.username} onChange={set("username")} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={form.phoneNumber} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); if (v.length <= 10) setForm((f) => ({ ...f, phoneNumber: v })); }} placeholder="07X XXX XXXX" type="tel" className="pl-10 bg-secondary border-border" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type={showPw ? "text" : "password"} value={form.password} onChange={set("password")} placeholder="••••••••" className="pl-10 pr-10 bg-secondary border-border" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showPw ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Must be at least 8 characters long</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Confirm Password</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="password" value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="••••••••" className="pl-10 bg-secondary border-border" />
              </div>
            </div>

            <label className="flex items-start gap-2 text-sm text-muted-foreground cursor-pointer">
              <Checkbox checked={agree} onCheckedChange={(c) => setAgree(!!c)} className="mt-0.5" />
              <span>By creating an account, I agree to the <a href="/terms" className="text-primary hover:underline">Terms of Service</a> and <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.</span>
            </label>

            <Button type="submit" disabled={isSubmitting} className="w-full gradient-cta text-primary-foreground font-semibold py-3 text-base flex items-center justify-center gap-2">
              {isSubmitting ? "Creating Account..." : "Create Account"} <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
