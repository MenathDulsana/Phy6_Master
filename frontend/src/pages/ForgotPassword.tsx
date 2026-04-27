import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, KeyRound, Lock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { requestPasswordReset, resetPassword } from "@/lib/auth-api";

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<number | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const navigate = useNavigate();

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error("Please enter your username or email");
      return;
    }

    setIsRequesting(true);
    try {
      const response = await requestPasswordReset(identifier.trim());
      setGeneratedToken(response.resetToken);
      setExpiresIn(response.expiresInMinutes);
      if (response.resetToken) {
        setToken(response.resetToken);
      }
      toast.success(response.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to generate reset token";
      toast.error(message);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsResetting(true);
    try {
      const response = await resetPassword(token.trim(), newPassword);
      toast.success(response.message || "Password reset successful");
      navigate("/signin");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to reset password";
      toast.error(message);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto border-b border-border">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg gradient-cta flex items-center justify-center"><Zap className="h-4 w-4 text-primary-foreground" /></div>
          <span className="font-display text-lg font-bold text-foreground">Phy6 Master</span>
        </Link>
        <Link to="/signin" className="text-sm text-primary hover:underline flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Sign In
        </Link>
      </nav>

      <div className="max-w-xl mx-auto px-4 py-12 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-card border border-border p-8 shadow-card"
        >
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Forgot Password</h1>
          <p className="text-sm text-muted-foreground mb-6">Generate a password reset token using your username or email.</p>

          <form onSubmit={handleRequestToken} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Username or Email</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter username or email"
                  className="pl-10 bg-secondary border-border"
                />
              </div>
            </div>

            <Button type="submit" disabled={isRequesting} className="w-full gradient-cta text-primary-foreground">
              {isRequesting ? "Generating Token..." : "Generate Reset Token"}
            </Button>
          </form>

          {generatedToken && (
            <div className="mt-5 rounded-lg border border-primary/25 bg-primary/10 p-3">
              <p className="text-sm text-foreground">
                Reset token: <span className="font-mono break-all">{generatedToken}</span>
              </p>
              {expiresIn && (
                <p className="text-xs text-muted-foreground mt-1">This token expires in {expiresIn} minutes.</p>
              )}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="rounded-2xl bg-card border border-border p-8 shadow-card"
        >
          <h2 className="text-xl font-display font-bold text-foreground mb-2">Reset Password</h2>
          <p className="text-sm text-muted-foreground mb-6">Enter your token and set a new password.</p>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Reset Token</label>
              <Input value={token} onChange={(e) => setToken(e.target.value)} className="bg-secondary border-border" />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 bg-secondary border-border"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Confirm New Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

            <Button type="submit" disabled={isResetting} className="w-full">
              {isResetting ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
