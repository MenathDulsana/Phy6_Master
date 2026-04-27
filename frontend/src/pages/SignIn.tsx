import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, User, Eye, EyeOff, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { signIn } from "@/lib/auth-api";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await signIn(email.trim(), password);

      localStorage.setItem("authRole", response.role);
      localStorage.setItem("authName", response.name || "");
      localStorage.setItem("authUsername", response.username);
      localStorage.setItem("authUserId", String(response.userId));

      toast.success(response.message || "Signed in successfully!");

      if (response.role === "TEACHER") {
        navigate("/teacher/dashboard");
        return;
      }

      if (response.role === "ACCOUNTANT") {
        navigate("/accountant/dashboard");
        return;
      }

      if (response.role === "TUTOR" || response.role === "TUTE_MANAGER") {
        navigate("/tute/dashboard");
        return;
      }

      navigate("/student/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign in";
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
          <span className="text-sm text-muted-foreground hidden sm:block">Don't have an account?</span>
          <Link to="/signup"><Button variant="outline" className="border-border text-foreground text-sm">Sign Up</Button></Link>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-12">
        <p className="text-center text-muted-foreground mb-8">Welcome back to Phy6 Master</p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-card border border-border p-8 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email or Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 bg-secondary border-border" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-10 pr-10 bg-secondary border-border" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showPw ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <Checkbox checked={remember} onCheckedChange={(c) => setRemember(!!c)} /> Remember me
              </label>
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">Forgot Password?</Link>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full gradient-cta text-primary-foreground font-semibold py-3 text-base flex items-center justify-center gap-2">
              {isSubmitting ? "Signing In..." : "Sign In"} <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
