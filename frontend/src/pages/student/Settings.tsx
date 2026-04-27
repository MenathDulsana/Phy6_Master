import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, KeyRound, ShieldCheck, User, Palette, School } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useStudentByUser, useUpdateStudentProfile } from "@/lib/api";
import { useTheme } from "@/hooks/useTheme";

const card = "rounded-xl border border-border bg-card p-6 shadow-card";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const userId = Number(localStorage.getItem("authUserId")) || undefined;
  const { data: student, isLoading } = useStudentByUser(userId);
  const updateProfile = useUpdateStudentProfile(userId);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileForm, setProfileForm] = useState({
    email: "",
    phoneNumber: "",
    address: "",
    school: "",
    stream: "",
    batch: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const syncProfileForm = (source = student) => {
    if (!source) return;
    setProfileForm((prev) => ({
      ...prev,
      email: source.user?.email || "",
      phoneNumber: source.user?.phoneNumber || "",
      address: source.address || "",
      school: source.school || "",
      stream: source.stream || "",
      batch: source.batch || "",
    }));
  };

  useEffect(() => {
    if (!student || isEditingProfile) return;
    syncProfileForm(student);
  }, [student, isEditingProfile]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await updateProfile.mutateAsync({
        email: profileForm.email.trim(),
        phoneNumber: profileForm.phoneNumber.trim(),
        address: profileForm.address.trim(),
        school: profileForm.school.trim(),
        stream: profileForm.stream,
        batch: profileForm.batch.trim(),
      });
      toast.success(response.message || "Profile updated successfully");
      setIsEditingProfile(false);
      syncProfileForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update profile";
      toast.error(message);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const response = await updateProfile.mutateAsync({
        newPassword: passwordForm.newPassword.trim(),
      });
      toast.success(response.message || "Password updated successfully");
      setPasswordForm({ newPassword: "", confirmPassword: "" });
      setIsChangingPassword(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update password";
      toast.error(message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="font-display text-2xl font-bold text-foreground">Settings</motion.h1>

      {/* Profile */}
        <div className={card}>
          <div className="flex items-center gap-2 mb-6"><User className="h-5 w-5 text-primary" /><h2 className="font-display font-semibold text-foreground">Profile</h2></div>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading profile...</p>
          ) : student ? (
            <>
              {!isEditingProfile && !isChangingPassword && (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                      {student.user?.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{student.user?.name}</p>
                      <p className="text-sm text-muted-foreground">{student.user?.role}</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between p-3 rounded-lg bg-secondary text-muted-foreground">
                      <span>Username</span>
                      <span className="font-medium">{student.user?.username}</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-lg bg-secondary text-muted-foreground">
                      <span>Student ID</span>
                      <span className="font-medium">{student.studentId || "–"}</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-lg bg-secondary">
                      <span className="text-muted-foreground">Email</span>
                      <span className="text-foreground font-medium">{student.user?.email || "–"}</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-lg bg-secondary">
                      <span className="text-muted-foreground">Phone</span>
                      <span className="text-foreground font-medium">{student.user?.phoneNumber || "–"}</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-lg bg-secondary">
                      <span className="text-muted-foreground">Stream</span>
                      <span className="text-foreground font-medium">{student.stream || "–"}</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-lg bg-secondary">
                      <span className="text-muted-foreground">Batch</span>
                      <span className="text-foreground font-medium">{student.batch || "–"}</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-lg bg-secondary">
                      <span className="text-muted-foreground">School</span>
                      <span className="text-foreground font-medium">{student.school || "–"}</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-lg bg-secondary">
                      <span className="text-muted-foreground">Address</span>
                      <span className="text-foreground font-medium">{student.address || "–"}</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-lg bg-secondary">
                      <span className="text-muted-foreground">Status</span>
                      <span className={`font-medium ${student.user?.isActive ? "text-green-500" : "text-muted-foreground"}`}>{student.user?.isActive ? "Active" : "Inactive"}</span>
                    </div>
                  </div>
                </>
              )}

              <div className="mt-6 space-y-3">
                {!isEditingProfile && !isChangingPassword && (
                  <>
                    <Button type="button" className="w-full gradient-cta text-primary-foreground font-semibold py-3 text-base"
                      onClick={() => {
                        syncProfileForm();
                        setIsEditingProfile(true);
                        setIsChangingPassword(false);
                      }}>
                      Edit Profile
                    </Button>
                    <Button type="button" variant="outline" className="w-full border-border"
                      onClick={() => {
                        setPasswordForm({ newPassword: "", confirmPassword: "" });
                        setIsChangingPassword(true);
                        setIsEditingProfile(false);
                      }}>
                      Change Password
                    </Button>
                  </>
                )}

                {isEditingProfile && (
                  <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input value={profileForm.email} onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))} type="email" className="pl-10 bg-secondary border-border" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input value={profileForm.phoneNumber} onChange={(e) => setProfileForm((prev) => ({ ...prev, phoneNumber: e.target.value }))} className="pl-10 bg-secondary border-border" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input value={profileForm.address} onChange={(e) => setProfileForm((prev) => ({ ...prev, address: e.target.value }))} className="pl-10 bg-secondary border-border" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">School</label>
                      <div className="relative">
                        <School className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input value={profileForm.school} onChange={(e) => setProfileForm((prev) => ({ ...prev, school: e.target.value }))} className="pl-10 bg-secondary border-border" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Stream</label>
                      <Select value={profileForm.stream || ""} onValueChange={(value) => setProfileForm((prev) => ({ ...prev, stream: value }))}>
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue placeholder="Select stream" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MATHS">Maths</SelectItem>
                          <SelectItem value="BIO">Bio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Batch</label>
                      <Select value={profileForm.batch || ""} onValueChange={(value) => setProfileForm((prev) => ({ ...prev, batch: value }))}>
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue placeholder="Select batch" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2026 A/L">2026 A/L</SelectItem>
                          <SelectItem value="2027 A/L">2027 A/L</SelectItem>
                          <SelectItem value="2028 A/L">2028 A/L</SelectItem>
                          <SelectItem value="2029 A/L">2029 A/L</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" className="flex-1 border-border"
                        onClick={() => {
                          syncProfileForm();
                          setIsEditingProfile(false);
                        }}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={updateProfile.isPending} className="flex-1 gradient-cta text-primary-foreground font-semibold">
                        {updateProfile.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                )}

                {isChangingPassword && (
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">New Password</label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))} placeholder="••••••••" className="pl-10 bg-secondary border-border" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Must be at least 6 characters long.</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Confirm New Password</label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} placeholder="••••••••" className="pl-10 bg-secondary border-border" />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" className="flex-1 border-border"
                        onClick={() => {
                          setPasswordForm({ newPassword: "", confirmPassword: "" });
                          setIsChangingPassword(false);
                        }}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={updateProfile.isPending} className="flex-1 gradient-cta text-primary-foreground font-semibold">
                        {updateProfile.isPending ? "Saving..." : "Update Password"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Unable to load profile.</p>
        )}
      </div>

      {!isChangingPassword && (
        <div className={card}>
          <div className="flex items-center gap-2 mb-6"><Palette className="h-5 w-5 text-primary" /><h2 className="font-display font-semibold text-foreground">Appearance</h2></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Dark Mode</p>
              <p className="text-xs text-muted-foreground">Toggle between dark and light theme</p>
            </div>
            <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
          </div>
        </div>
      )}
    </div>
  );
}
