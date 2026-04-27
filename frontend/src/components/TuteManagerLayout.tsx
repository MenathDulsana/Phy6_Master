import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  CircleCheckBig,
  Ban,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Settings,
  SquarePen,
} from "lucide-react";

const sidebarLinks = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/tute/dashboard" },
  { label: "Incoming Requests", icon: SquarePen, path: "/tute/incoming-requests" },
  { label: "Active Requests", icon: CircleCheckBig, path: "/tute/active-requests" },
  { label: "Declined Requests", icon: Ban, path: "/tute/declined-requests" },
  { label: "Delivery Records", icon: FileCheck2, path: "/tute/delivery-records" },
  { label: "Profile Settings", icon: Settings, path: "/tute/profile-settings" },
];

export default function TuteManagerLayout() {
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const userName = localStorage.getItem("authName") || "Tute Manager";
  const userInitial = userName.charAt(0).toUpperCase();

  useEffect(() => {
    const role = localStorage.getItem("authRole");
    if (role !== "TUTOR" && role !== "TUTE_MANAGER") {
      navigate("/signin");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("authRole");
    localStorage.removeItem("authName");
    localStorage.removeItem("authUsername");
    localStorage.removeItem("authUserId");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-sidebar">
        <div className="flex items-center gap-2 border-b border-sidebar-border px-4 py-5">
          <GraduationCap className="h-6 w-6 shrink-0 text-sidebar-primary" />
          <span className="font-display text-lg font-bold text-sidebar-foreground">Phy6 Master</span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {sidebarLinks.map((link) => {
            const active = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                }`}
              >
                <link.icon className="h-4 w-4 shrink-0" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent/50"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="ml-64 flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-end gap-4 border-b border-border bg-background/90 px-6 py-3 backdrop-blur-md">
          <div className="relative">
            <button
              onClick={() => setProfileOpen((open) => !open)}
              className="flex items-center gap-2 rounded-lg p-1.5 pr-3 transition-colors hover:bg-accent"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-amber-50">
                {userInitial}
              </div>
              <span className="hidden text-sm font-medium text-foreground sm:block">{userName}</span>
              <ChevronDown className="hidden h-3 w-3 text-muted-foreground sm:block" />
            </button>
            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-border bg-card p-2 shadow-card"
                >
                  <Link
                    to="/tute/profile-settings"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent"
                  >
                    <Settings className="h-4 w-4" />
                    Profile Settings
                  </Link>
                  <hr className="my-1 border-border" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-accent"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
