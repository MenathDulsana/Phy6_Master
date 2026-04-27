import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
    DollarSign, FileWarning, CheckCircle, FileText,
    CreditCard, ChevronRight, ShieldCheck, Clock,
    TrendingDown, BarChart3, Inbox
} from "lucide-react";
import { get } from "@/lib/api-client";
import { usePendingPayments } from "@/lib/api/accountant-payments";

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.35 },
});

const card = "rounded-xl bg-card border border-border shadow-card p-5";

export default function AccountantDashboard() {
    const accountantName = localStorage.getItem("authName") || "Accountant";
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    const monthName = new Date().toLocaleString("default", { month: "long" });

    const { data: pending = [], isLoading: loadingPending, isError: pendingError } =
        usePendingPayments();

    const { data: report, isLoading: loadingReport, isError: reportError } = useQuery<{
        approvedPaymentsCount?: number;
        totalFeesCollected?: number;
        pendingPaymentsCount?: number;
        rejectedPaymentsCount?: number;
    }>({
        queryKey: ["accountant-monthly-latest", month, year],
        queryFn: () => get(`/api/accountant/reports/financial?month=${month}&year=${year}`),
    });

    const formatCurrency = (n: number) =>
        new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(n);

    const manualPending = pending.filter(
        (p) => p.status === "SUBMITTED" && p.paymentMethod !== "ONLINE_PAYMENT"
    );
    const stripePending = pending.filter(
        (p) => p.status === "SUBMITTED" && p.paymentMethod === "ONLINE_PAYMENT"
    );
    const stripeNeedReceipt = pending.filter(
        (p) => p.paymentMethod === "ONLINE_PAYMENT" && p.status === "APPROVED"
    );

    const statCards = [
        {
            label: "Pending Verifications",
            value: pendingError ? "—" : pending.length,
            icon: FileWarning,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            border: "border-l-amber-500",
            route: "/accountant/payments",
            sub: "Require your action",
        },
        {
            label: "Approved This Month",
            value: reportError ? "—" : (report?.approvedPaymentsCount ?? 0),
            icon: CheckCircle,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            border: "border-l-emerald-500",
            route: "/accountant/reports/monthly",
            sub: monthName,
        },
        {
            label: "Revenue (MTD)",
            value: reportError ? "—" : formatCurrency(report?.totalFeesCollected ?? 0),
            icon: DollarSign,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            border: "border-l-blue-500",
            route: "/accountant/reports/monthly",
            sub: `${monthName} ${year}`,
        },
        {
            label: "Rejected This Month",
            value: reportError ? "—" : (report?.rejectedPaymentsCount ?? 0),
            icon: TrendingDown,
            color: "text-rose-500",
            bg: "bg-rose-500/10",
            border: "border-l-rose-500",
            route: "/accountant/payments/history",
            sub: "View history",
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div {...fadeUp(0)}>
                <h1 className="text-2xl font-display font-bold text-foreground">
                    Welcome back, {accountantName}!
                </h1>
                <p className="text-muted-foreground mt-1">
                    Financial overview for <span className="font-medium text-foreground">{monthName} {year}</span>
                </p>
            </motion.div>

            {/* Error banner */}
            {(pendingError || reportError) && (
                <motion.div {...fadeUp(0.05)}
                    className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
                    <FileWarning className="h-4 w-4 shrink-0" />
                    Some dashboard data could not be loaded. Please refresh or check your connection.
                </motion.div>
            )}

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((s, i) => (
                    <motion.div key={s.label} {...fadeUp(i * 0.08)}>
                        <Link to={s.route} className="block h-full">
                            <div className={`${card} border-l-4 ${s.border} hover:shadow-md transition-shadow h-full`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${s.bg}`}>
                                        <s.icon className={`h-4.5 w-4.5 ${s.color}`} />
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                                </div>
                                {(loadingPending || loadingReport) ? (
                                    <div className="h-7 w-24 bg-secondary rounded animate-pulse mb-1" />
                                ) : (
                                    <p className="text-2xl font-bold text-foreground truncate">{s.value}</p>
                                )}
                                <p className="text-sm font-medium text-muted-foreground mt-0.5">{s.label}</p>
                                <p className="text-xs text-muted-foreground/60 mt-0.5">{s.sub}</p>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>

            {/* Pending Breakdown + Recent Queue */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pending breakdown pills */}
                <motion.div {...fadeUp(0.32)} className={`${card} space-y-4`}>
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        <h2 className="font-display font-semibold text-foreground">Queue Breakdown</h2>
                    </div>

                    {loadingPending ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-12 rounded-lg bg-secondary animate-pulse" />
                            ))}
                        </div>
                    ) : pending.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <CheckCircle className="h-10 w-10 text-emerald-500/40 mb-2" />
                            <p className="text-sm font-medium text-foreground">All caught up!</p>
                            <p className="text-xs text-muted-foreground mt-1">No payments are pending.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {manualPending.length > 0 && (
                                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                    <div className="flex items-center gap-2">
                                        <FileWarning className="h-4 w-4 text-amber-600" />
                                        <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Manual (Bank/ATM)</span>
                                    </div>
                                    <span className="text-lg font-bold text-amber-700 dark:text-amber-400">{manualPending.length}</span>
                                </div>
                            )}
                            {stripePending.length > 0 && (
                                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Stripe Awaiting</span>
                                    </div>
                                    <span className="text-lg font-bold text-blue-700 dark:text-blue-400">{stripePending.length}</span>
                                </div>
                            )}
                            {stripeNeedReceipt.length > 0 && (
                                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Receipt Needed</span>
                                    </div>
                                    <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{stripeNeedReceipt.length}</span>
                                </div>
                            )}
                            <Link
                                to="/accountant/payments"
                                className="flex items-center justify-center gap-2 w-full mt-2 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
                            >
                                Review All Pending <ChevronRight className="h-4 w-4" />
                            </Link>
                        </div>
                    )}
                </motion.div>

                {/* Recent pending queue preview */}
                <motion.div {...fadeUp(0.38)} className={`${card} lg:col-span-2`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Inbox className="h-5 w-5 text-primary" />
                            <h2 className="font-display font-semibold text-foreground">Recent Submissions</h2>
                        </div>
                        <Link to="/accountant/payments" className="text-xs text-primary hover:underline">
                            View all
                        </Link>
                    </div>

                    {loadingPending ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-lg bg-secondary animate-pulse" />)}
                        </div>
                    ) : pending.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                            <CheckCircle className="h-12 w-12 opacity-20 mb-3" />
                            <p className="text-sm font-medium">No pending submissions</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {pending.slice(0, 5).map((p) => {
                                const isStripe = p.paymentMethod === "ONLINE_PAYMENT";
                                const needsReceipt = isStripe && p.status === "APPROVED";
                                return (
                                    <Link
                                        key={p.id}
                                        to={`/accountant/payments/${p.id}`}
                                        className="flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-accent/60 transition-colors group"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-medium text-foreground truncate">{p.studentName}</p>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm shrink-0 ${
                                                    needsReceipt
                                                        ? "bg-emerald-500/15 text-emerald-600"
                                                        : isStripe
                                                        ? "bg-blue-500/15 text-blue-600"
                                                        : "bg-amber-500/15 text-amber-600"
                                                }`}>
                                                    {needsReceipt ? "RECEIPT NEEDED" : isStripe ? "STRIPE" : "MANUAL"}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.courseName} · {new Date(p.submissionDate).toLocaleDateString()}</p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 ml-2" />
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Quick Actions */}
            <motion.div {...fadeUp(0.44)}>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Link to="/accountant/payments"
                        className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border shadow-card hover:shadow-md hover:border-primary/40 transition-all group">
                        <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                            <FileWarning className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">Verify Payments</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Approve or reject submissions</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/40 ml-auto group-hover:text-primary transition-colors" />
                    </Link>

                    <Link to="/accountant/reports/monthly"
                        className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border shadow-card hover:shadow-md hover:border-primary/40 transition-all group">
                        <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                            <BarChart3 className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">Financial Reports</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Monthly revenue breakdown</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/40 ml-auto group-hover:text-primary transition-colors" />
                    </Link>

                    <Link to="/accountant/payments/history"
                        className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border shadow-card hover:shadow-md hover:border-primary/40 transition-all group">
                        <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <FileText className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">Audit Log</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Full payment history</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/40 ml-auto group-hover:text-primary transition-colors" />
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
