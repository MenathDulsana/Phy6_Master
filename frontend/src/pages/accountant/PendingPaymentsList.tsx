import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { usePendingPayments } from "@/lib/api/accountant-payments";
import {
    CheckCircle2, ChevronRight, ShieldCheck, FileText,
    CreditCard, Building2, Banknote, AlertCircle, Clock, Inbox,
    ArrowUp,
} from "lucide-react";

function getWaitingTime(dateStr: string): string {
    const submitted = new Date(dateStr).getTime();
    const now = Date.now();
    const diffMs = now - submitted;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 60) return `${diffMin}m`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h`;
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays}d`;
}

function WaitBadge({ dateStr }: { dateStr: string }) {
    const submitted = new Date(dateStr).getTime();
    const diffDays = (Date.now() - submitted) / 86400000;
    const label = getWaitingTime(dateStr);
    const isUrgent = diffDays >= 2;
    if (isUrgent) {
        return (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                <Clock className="h-2.5 w-2.5" /> {label}
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="h-2.5 w-2.5" /> {label}
        </span>
    );
}

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.35 },
});

function MethodBadge({ method }: { method: string }) {
    if (method === "ONLINE_PAYMENT") {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <CreditCard className="h-3 w-3" /> Stripe Online
            </span>
        );
    }
    if (method === "ATM_TRANSFER") {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <Banknote className="h-3 w-3" /> ATM Transfer
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary text-muted-foreground border border-border">
            <Building2 className="h-3 w-3" /> Bank Slip
        </span>
    );
}

function StatusBadge({ method, status }: { method: string; status: string }) {
    const isStripe = method === "ONLINE_PAYMENT";
    const needsReceipt = isStripe && status === "APPROVED";
    if (needsReceipt) {
        return (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" /> Receipt Needed
            </span>
        );
    }
    if (isStripe) {
        return (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                <Clock className="h-3.5 w-3.5" /> Stripe Confirmed
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-3.5 w-3.5" /> Awaiting Approval
        </span>
    );
}

export default function PendingPaymentsList() {
    const { data: payments = [], isLoading, isError } = usePendingPayments();

    const manualCount = payments.filter(
        (p) => p.status === "SUBMITTED" && p.paymentMethod !== "ONLINE_PAYMENT"
    ).length;
    const stripeCount = payments.filter(
        (p) => p.status === "SUBMITTED" && p.paymentMethod === "ONLINE_PAYMENT"
    ).length;
    const receiptCount = payments.filter((p) => p.status === "APPROVED").length;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-foreground">Pending Verifications</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Review payment submissions and issue official receipts.
                    </p>
                </div>

                {payments.length > 0 && (
                    <div className="flex flex-wrap gap-2 text-xs">
                        {manualCount > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25 font-medium">
                                <AlertCircle className="h-3.5 w-3.5" />
                                {manualCount} manual pending
                            </span>
                        )}
                        {stripeCount > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/25 font-medium">
                                <CreditCard className="h-3.5 w-3.5" />
                                {stripeCount} Stripe awaiting
                            </span>
                        )}
                        {receiptCount > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 font-medium">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                {receiptCount} receipt needed
                            </span>
                        )}
                    </div>
                )}
            </motion.div>

            {/* Table card */}
            <motion.div {...fadeUp(0.08)} className="rounded-xl bg-card border border-border shadow-card overflow-hidden">
                {isLoading ? (
                    <div className="p-12 space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-14 rounded-lg bg-secondary animate-pulse" />
                        ))}
                    </div>
                ) : isError ? (
                    <div className="p-12 flex flex-col items-center text-center">
                        <AlertCircle className="h-12 w-12 text-destructive/40 mb-3" />
                        <h3 className="font-semibold text-foreground">Failed to load payments</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Please refresh the page or check your connection.
                        </p>
                    </div>
                ) : payments.length === 0 ? (
                    <div className="p-16 flex flex-col items-center text-center">
                        <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground">All caught up!</h3>
                        <p className="text-muted-foreground text-sm mt-2 max-w-xs">
                            No payments are currently awaiting accountant verification. All submitted payments have been verified or actioned.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-secondary/60 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                                    <tr>
                                        <th className="px-5 py-3.5 font-semibold">
                                            <span className="flex items-center gap-1">
                                                Submitted <ArrowUp className="h-3 w-3 text-primary" title="Oldest first" />
                                            </span>
                                        </th>
                                        <th className="px-5 py-3.5 font-semibold">Waiting</th>
                                        <th className="px-5 py-3.5 font-semibold">Student</th>
                                        <th className="px-5 py-3.5 font-semibold">Course</th>
                                        <th className="px-5 py-3.5 font-semibold">Method</th>
                                        <th className="px-5 py-3.5 font-semibold">Status</th>
                                        <th className="px-5 py-3.5 font-semibold text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {payments.map((payment) => {
                                        const isStripe = payment.paymentMethod === "ONLINE_PAYMENT";
                                        const needsReceipt = isStripe && payment.status === "APPROVED";
                                        return (
                                            <tr
                                                key={payment.id}
                                                className={`hover:bg-accent/40 transition-colors ${
                                                    needsReceipt
                                                        ? "bg-emerald-500/5"
                                                        : isStripe
                                                        ? "bg-blue-500/5"
                                                        : ""
                                                }`}
                                            >
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <p className="text-foreground">{new Date(payment.submissionDate).toLocaleDateString()}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(payment.submissionDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <WaitBadge dateStr={payment.submissionDate} />
                                                </td>
                                                <td className="px-5 py-4 font-medium text-foreground">{payment.studentName}</td>
                                                <td className="px-5 py-4 text-muted-foreground max-w-[180px] truncate">{payment.courseName}</td>
                                                <td className="px-5 py-4">
                                                    <MethodBadge method={payment.paymentMethod} />
                                                </td>
                                                <td className="px-5 py-4">
                                                    <StatusBadge method={payment.paymentMethod} status={payment.status} />
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <Link
                                                        to={`/accountant/payments/${payment.id}`}
                                                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                                                            needsReceipt
                                                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                                                                : "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
                                                        }`}
                                                    >
                                                        {needsReceipt ? (
                                                            <><FileText className="h-3.5 w-3.5" /> Issue Receipt</>
                                                        ) : (
                                                            <>Review <ChevronRight className="h-3.5 w-3.5" /></>
                                                        )}
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="md:hidden divide-y divide-border">
                            {payments.map((payment) => {
                                const isStripe = payment.paymentMethod === "ONLINE_PAYMENT";
                                const needsReceipt = isStripe && payment.status === "APPROVED";
                                return (
                                    <Link
                                        key={payment.id}
                                        to={`/accountant/payments/${payment.id}`}
                                        className="flex items-start justify-between p-4 hover:bg-accent/40 transition-colors gap-3"
                                    >
                                        <div className="min-w-0 flex-1 space-y-1.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-semibold text-sm text-foreground">{payment.studentName}</p>
                                                <StatusBadge method={payment.paymentMethod} status={payment.status} />
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate">{payment.courseName}</p>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <MethodBadge method={payment.paymentMethod} />
                                                <WaitBadge dateStr={payment.submissionDate} />
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(payment.submissionDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                                                needsReceipt
                                                    ? "bg-emerald-500/10 text-emerald-600"
                                                    : "bg-primary/10 text-primary"
                                            }`}>
                                                {needsReceipt ? "Issue Receipt" : "Review"}
                                            </span>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Footer count */}
                        <div className="border-t border-border px-5 py-3 flex items-center justify-between gap-2 bg-secondary/30">
                            <div className="flex items-center gap-2">
                                <Inbox className="h-4 w-4 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">
                                    {payments.length} submission{payments.length !== 1 ? "s" : ""} requiring action
                                </p>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground/70">
                                <ArrowUp className="h-3 w-3" />
                                Oldest first
                            </div>
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );
}
