import { motion } from "framer-motion";
import {
    User, Mail, Phone, Hash, Shield, Palette,
    CheckCircle, Calculator,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useUserProfile } from "@/lib/api/users";
import { useTheme } from "@/hooks/useTheme";

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.35 },
});

const card = "rounded-xl bg-card border border-border shadow-card p-6";

function InfoRow({ icon: Icon, label, value }: {
    icon: React.ElementType;
    label: string;
    value: string | undefined | null;
}) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-border/60 last:border-0">
            <div className="flex items-center gap-3 text-muted-foreground">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-sm">{label}</span>
            </div>
            <span className="text-sm font-medium text-foreground text-right max-w-[60%] truncate">
                {value || <span className="text-muted-foreground/60 italic">Not set</span>}
            </span>
        </div>
    );
}

export default function AccountantProfile() {
    const { theme, toggleTheme } = useTheme();
    const userId = Number(localStorage.getItem("authUserId")) || undefined;
    const userName = localStorage.getItem("authName") || "Accountant";
    const userInitial = userName.charAt(0).toUpperCase();

    const { data: user, isLoading, isError } = useUserProfile(userId);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <motion.div {...fadeUp(0)}>
                <h1 className="text-2xl font-display font-bold text-foreground">Profile & Settings</h1>
                <p className="text-muted-foreground mt-1 text-sm">View your account details and manage preferences.</p>
            </motion.div>

            {/* Avatar + role card */}
            <motion.div {...fadeUp(0.06)} className={card}>
                <div className="flex items-center gap-5">
                    <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shrink-0">
                        {userInitial}
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-lg font-bold text-foreground truncate">{userName}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                                <Calculator className="h-3 w-3" /> Accountant
                            </span>
                            {user?.isActive && (
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                    <CheckCircle className="h-3 w-3" /> Active
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Account information */}
            <motion.div {...fadeUp(0.1)} className={card}>
                <div className="flex items-center gap-2 mb-5">
                    <User className="h-5 w-5 text-primary" />
                    <h2 className="font-display font-semibold text-foreground">Account Information</h2>
                </div>

                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-11 rounded-lg bg-secondary animate-pulse" />
                        ))}
                    </div>
                ) : isError || !user ? (
                    <div className="flex flex-col items-center py-8 text-center text-muted-foreground">
                        <User className="h-10 w-10 opacity-20 mb-3" />
                        <p className="text-sm">Unable to load account details.</p>
                        <p className="text-xs mt-1">Your name is shown from the session above.</p>
                    </div>
                ) : (
                    <div>
                        <InfoRow icon={User} label="Full Name" value={user.name} />
                        <InfoRow icon={Hash} label="Username" value={user.username} />
                        <InfoRow icon={Mail} label="Email" value={user.email} />
                        <InfoRow icon={Phone} label="Phone" value={user.phoneNumber} />
                        <InfoRow icon={Shield} label="Role" value={user.role} />
                    </div>
                )}
            </motion.div>

            {/* Appearance */}
            <motion.div {...fadeUp(0.14)} className={card}>
                <div className="flex items-center gap-2 mb-5">
                    <Palette className="h-5 w-5 text-primary" />
                    <h2 className="font-display font-semibold text-foreground">Appearance</h2>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                    <div>
                        <p className="text-sm font-medium text-foreground">Dark Mode</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Switch between dark and light theme
                        </p>
                    </div>
                    <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
                </div>
            </motion.div>
        </div>
    );
}
