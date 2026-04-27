import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard, CreditCard, LogOut, Calculator, BarChart3, User, ChevronDown, History, Menu, X,
} from "lucide-react";
import NotificationBell from "./NotificationBell";

const navLinks = [
    { label: "Dashboard",        path: "/accountant/dashboard",       icon: LayoutDashboard },
    { label: "Pending Payments", path: "/accountant/payments",        icon: CreditCard },
    { label: "Payment History",  path: "/accountant/payments/history", icon: History },
    { label: "Financial Reports",path: "/accountant/reports/monthly", icon: BarChart3 },
    { label: "Profile",          path: "/accountant/profile",         icon: User },
];

export default function AccountantLayout() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const userName = localStorage.getItem("authName") || "Accountant";
    const userInitial = userName.charAt(0).toUpperCase();
    const userId = Number(localStorage.getItem("authUserId")) || undefined;

    useEffect(() => {
        if (localStorage.getItem("authRole") !== "ACCOUNTANT") {
            navigate("/signin");
        }
    }, [navigate]);

    // Close mobile sidebar on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        localStorage.removeItem("authRole");
        localStorage.removeItem("authName");
        localStorage.removeItem("authUsername");
        localStorage.removeItem("authUserId");
        navigate("/");
    };

    return (
        <div className="min-h-screen bg-background flex">
            {/* Mobile overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                        onClick={() => setMobileOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-40 w-60 flex flex-col border-r border-border bg-sidebar transition-transform duration-300
                ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
                <div className="flex items-center justify-between px-4 py-5 border-b border-sidebar-border">
                    <div className="flex items-center gap-2">
                        <Calculator className="h-6 w-6 text-sidebar-primary shrink-0" />
                        <span className="font-display text-lg font-bold text-sidebar-foreground">Phy6 Master</span>
                    </div>
                    <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1 rounded text-sidebar-foreground hover:bg-sidebar-accent/50">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
                    {navLinks.map((link) => {
                        const active = link.path === "/accountant/payments"
                            ? location.pathname === "/accountant/payments" ||
                              (location.pathname.startsWith("/accountant/payments/") && !location.pathname.startsWith("/accountant/payments/history"))
                            : location.pathname.startsWith(link.path);
                        return (
                            <Link key={link.path} to={link.path}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"}`}>
                                <link.icon className={`h-5 w-5 shrink-0 ${active ? "text-sidebar-primary" : ""}`} />
                                <span>{link.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-3 border-t border-sidebar-border">
                    <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 w-full">
                        <LogOut className="h-5 w-5 shrink-0" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col lg:ml-60">
                <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-border bg-background/80 backdrop-blur-md px-4 sm:px-6 py-3">
                    <div className="flex items-center gap-3">
                        {/* Hamburger — mobile only */}
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors"
                            aria-label="Open navigation"
                        >
                            <Menu className="h-5 w-5 text-foreground" />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <NotificationBell userId={userId} />

                        <div className="relative border-l border-border pl-4 ml-2">
                            <button onClick={() => setProfileOpen(!profileOpen)}
                                className="flex items-center gap-2 p-1.5 pr-3 rounded-lg hover:bg-accent transition-colors">
                                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{userInitial}</div>
                                <span className="text-sm font-medium text-foreground hidden sm:block">{userName}</span>
                                <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
                            </button>
                            <AnimatePresence>
                                {profileOpen && (
                                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                                        className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-card shadow-card p-2 z-50">
                                        <Link to="/accountant/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-accent"><User className="h-4 w-4" /> Profile</Link>
                                        <hr className="my-1 border-border" />
                                        <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-accent w-full"><LogOut className="h-4 w-4" /> Sign Out</button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-6 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
