import { Palette, User } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/hooks/useTheme";
import { useUserProfile } from "@/lib/api";

type InfoRowProps = {
  label: string;
  value: string;
  valueClassName?: string;
};

function InfoRow({ label, value, valueClassName = "text-foreground" }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between rounded-md bg-secondary px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${valueClassName}`}>{value}</span>
    </div>
  );
}

export default function ProfileSettings() {
  const { theme, toggleTheme } = useTheme();
  const userId = Number(localStorage.getItem("authUserId")) || undefined;
  const { data: user } = useUserProfile(userId);

  const displayName = (localStorage.getItem("authName") || user?.name || "Tute manager").trim();
  const initial = displayName.charAt(0).toUpperCase() || "T";
  const username = user?.username || localStorage.getItem("authUsername") || "—";
  const email = user?.email || "—";
  const phone = user?.phoneNumber || "—";
  const statusText = user?.isActive === false ? "Inactive" : "Active";

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-display font-bold text-foreground">Settings</h1>

      <section className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h2 className="mb-5 flex items-center gap-2 text-xl font-display font-semibold text-foreground">
          <User className="h-5 w-5 text-primary" />
          Profile
        </h2>

        <div className="mb-5 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
            {initial}
          </div>
          <p className="text-3xl font-display font-semibold text-foreground">{displayName}</p>
        </div>

        <div className="space-y-3">
          <InfoRow label="Username" value={username} />
          <InfoRow label="Email" value={email} />
          <InfoRow label="Phone" value={phone} />
          <InfoRow label="Status" value={statusText} valueClassName={statusText === "Active" ? "text-emerald-500" : "text-muted-foreground"} />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h2 className="mb-5 flex items-center gap-2 text-xl font-display font-semibold text-foreground">
          <Palette className="h-5 w-5 text-primary" />
          Appearance
        </h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-foreground">Dark Mode</p>
            <p className="text-sm text-muted-foreground">Toggle between dark and light theme</p>
          </div>
          <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
        </div>
      </section>
    </div>
  );
}
