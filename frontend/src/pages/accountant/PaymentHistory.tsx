import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
    Search, CreditCard, Filter, X, Download,
    Building2, Banknote, AlertCircle, CheckCircle,
    Clock, ChevronRight, Receipt, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { get } from "@/lib/api-client";
import { useGenerateReceipt } from "@/lib/api/accountant-payments";
import { toast } from "sonner";

type PaymentHistoryDTO = {
    id: number;
    studentId: number | null;
    studentName: string;
    courseId: number | null;
    courseName: string;
    amount: number;
    paymentMethod: string;
    referenceNumber: string | null;
    status: string;
    verifiedBy: string | null;
    submittedAt: string;
    verifiedAt: string | null;
    rejectionReason: string | null;
    receiptNumber: string | null;
};

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.35 },
});

function StatusBadge({ status }: { status: string }) {
    if (status === "APPROVED")
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold uppercase rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-3 w-3" /> Approved
            </span>
        );
    if (status === "REJECTED")
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold uppercase rounded-full bg-destructive/10 text-destructive">
                <X className="h-3 w-3" /> Rejected
            </span>
        );
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold uppercase rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Clock className="h-3 w-3" /> Pending
        </span>
    );
}

function MethodLabel({ method }: { method: string }) {
    if (method === "ONLINE_PAYMENT")
        return <span className="inline-flex items-center gap-1.5 text-xs text-blue-600"><CreditCard className="h-3.5 w-3.5" />Stripe</span>;
    if (method === "ATM_TRANSFER")
        return <span className="inline-flex items-center gap-1.5 text-xs text-purple-600"><Banknote className="h-3.5 w-3.5" />ATM Transfer</span>;
    return <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Building2 className="h-3.5 w-3.5" />Bank Slip</span>;
}

export default function PaymentHistory() {
    const [studentName, setStudentName] = useState("");
    const [courseName, setCourseName] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("ALL");
    const [status, setStatus] = useState("ALL");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [generatingReceiptId, setGeneratingReceiptId] = useState<number | null>(null);

    const generateReceiptMutation = useGenerateReceipt();

    const buildQueryParams = () => {
        const params = new URLSearchParams();
        if (studentName.trim()) params.append("studentName", studentName.trim());
        if (courseName.trim()) params.append("courseName", courseName.trim());
        if (paymentMethod !== "ALL") params.append("paymentMethod", paymentMethod);
        if (status !== "ALL") params.append("status", status);
        if (startDate) params.append("startDate", new Date(startDate).toISOString());
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            params.append("endDate", end.toISOString());
        }
        return params.toString();
    };

    const hasActiveFilters =
        studentName.trim() || courseName.trim() || paymentMethod !== "ALL" ||
        status !== "ALL" || startDate || endDate;

    const { data: payments, isLoading, isError } = useQuery<PaymentHistoryDTO[]>({
        queryKey: ["accountant-payment-history", studentName, courseName, paymentMethod, status, startDate, endDate],
        queryFn: () => get<PaymentHistoryDTO[]>(`/api/accountant/payments/history?${buildQueryParams()}`),
    });

    const handleGenerateReceipt = (paymentId: number) => {
        setGeneratingReceiptId(paymentId);
        generateReceiptMutation.mutate(paymentId, {
            onSuccess: () => {
                toast.success("Receipt generated successfully!");
                setGeneratingReceiptId(null);
            },
            onError: (err: unknown) => {
                toast.error(err instanceof Error ? err.message : "Failed to generate receipt");
                setGeneratingReceiptId(null);
            },
        });
    };

    const handleClearFilters = () => {
        setStudentName("");
        setCourseName("");
        setPaymentMethod("ALL");
        setStatus("ALL");
        setStartDate("");
        setEndDate("");
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(amount);

    const totalApproved = payments
        ?.filter((p) => p.status === "APPROVED")
        .reduce((sum, p) => sum + (p.amount ?? 0), 0) ?? 0;

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <motion.div {...fadeUp(0)} className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-display font-bold text-foreground">Payment History</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Full audit log of all payment transactions.</p>
                </div>
                {payments && payments.length > 0 && totalApproved > 0 && (
                    <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-right">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Approved Revenue (filtered)</p>
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalApproved)}</p>
                    </div>
                )}
            </motion.div>

            {/* Filters */}
            <motion.div {...fadeUp(0.06)} className="rounded-xl bg-card border border-border shadow-card p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">Filters</span>
                    {hasActiveFilters && (
                        <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-primary/10 text-primary">
                            Active
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Student Name</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="e.g. Kasun"
                                value={studentName}
                                onChange={(e) => setStudentName(e.target.value)}
                                className="pl-9 bg-secondary border-border"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Course Name</label>
                        <Input
                            placeholder="e.g. Physics 6A"
                            value={courseName}
                            onChange={(e) => setCourseName(e.target.value)}
                            className="bg-secondary border-border"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="bg-secondary border-border">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Statuses</SelectItem>
                                <SelectItem value="SUBMITTED">Pending / Submitted</SelectItem>
                                <SelectItem value="APPROVED">Approved</SelectItem>
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Payment Method</label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger className="bg-secondary border-border">
                                <SelectValue placeholder="All Methods" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Methods</SelectItem>
                                <SelectItem value="ATM_TRANSFER">ATM Transfer</SelectItem>
                                <SelectItem value="BANK_SLIP_UPLOAD">Bank Slip (Upload)</SelectItem>
                                <SelectItem value="BANK_SLIP">Bank Slip</SelectItem>
                                <SelectItem value="ONLINE_PAYMENT">Stripe Online</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">From Date</label>
                        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-secondary border-border" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">To Date</label>
                        <div className="flex gap-2">
                            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-secondary border-border flex-1" />
                            {hasActiveFilters && (
                                <Button variant="outline" onClick={handleClearFilters} title="Clear all filters" className="px-3 border-border shrink-0">
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Results */}
            <motion.div {...fadeUp(0.12)} className="rounded-xl bg-card border border-border shadow-card overflow-hidden">
                {isLoading ? (
                    <div className="p-10 space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-14 rounded-lg bg-secondary animate-pulse" />
                        ))}
                    </div>
                ) : isError ? (
                    <div className="p-12 flex flex-col items-center text-center">
                        <AlertCircle className="h-12 w-12 text-destructive/40 mb-3" />
                        <h3 className="font-semibold text-foreground">Failed to load payment history</h3>
                        <p className="text-sm text-muted-foreground mt-1">Please refresh the page or try again.</p>
                    </div>
                ) : !payments || payments.length === 0 ? (
                    <div className="p-12 flex flex-col items-center text-center">
                        <Search className="h-12 w-12 text-muted-foreground/25 mb-4" />
                        <h3 className="text-lg font-semibold text-foreground">No records found</h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                            No payment records match the selected filters. Try adjusting your search criteria.
                        </p>
                        {hasActiveFilters && (
                            <Button variant="outline" size="sm" onClick={handleClearFilters} className="mt-4 gap-2">
                                <X className="h-3.5 w-3.5" /> Clear Filters
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-secondary/60 border-b border-border">
                                    <tr>
                                        <th className="px-5 py-3.5 font-semibold">Date</th>
                                        <th className="px-5 py-3.5 font-semibold">Student</th>
                                        <th className="px-5 py-3.5 font-semibold">Course</th>
                                        <th className="px-5 py-3.5 font-semibold">Method</th>
                                        <th className="px-5 py-3.5 font-semibold">Amount</th>
                                        <th className="px-5 py-3.5 font-semibold">Status</th>
                                        <th className="px-5 py-3.5 font-semibold text-right">Receipt / Detail</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {payments.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-accent/30 transition-colors">
                                            <td className="px-5 py-4 whitespace-nowrap text-muted-foreground">
                                                {format(new Date(payment.submittedAt), "MMM dd, yyyy")}
                                            </td>
                                            <td className="px-5 py-4 font-medium text-foreground">{payment.studentName}</td>
                                            <td className="px-5 py-4 text-muted-foreground max-w-[160px] truncate">{payment.courseName}</td>
                                            <td className="px-5 py-4">
                                                <MethodLabel method={payment.paymentMethod} />
                                            </td>
                                            <td className="px-5 py-4 font-semibold text-foreground">
                                                {payment.amount ? formatCurrency(payment.amount) : "—"}
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusBadge status={payment.status} />
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-2 flex-wrap">
                                                    {payment.receiptNumber ? (
                                                        <a
                                                            href={`/api/accountant/receipts/${payment.id}/download`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            title={`Download receipt ${payment.receiptNumber}`}
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                                                        >
                                                            <Download className="h-3 w-3" /> Receipt
                                                        </a>
                                                    ) : payment.status === "APPROVED" ? (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleGenerateReceipt(payment.id); }}
                                                            disabled={generatingReceiptId === payment.id}
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                                                        >
                                                            <FileText className="h-3 w-3" />
                                                            {generatingReceiptId === payment.id ? "Generating…" : "Generate"}
                                                        </button>
                                                    ) : null}
                                                    <Link
                                                        to={`/accountant/payments/${payment.id}`}
                                                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                                                    >
                                                        Details <ChevronRight className="h-3 w-3" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="md:hidden divide-y divide-border">
                            {payments.map((payment) => (
                                <div key={payment.id} className="p-4 space-y-2 hover:bg-accent/30 transition-colors">
                                    <Link
                                        to={`/accountant/payments/${payment.id}`}
                                        className="flex items-start justify-between gap-3"
                                    >
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-semibold text-sm text-foreground">{payment.studentName}</p>
                                                <StatusBadge status={payment.status} />
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate">{payment.courseName}</p>
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <MethodLabel method={payment.paymentMethod} />
                                                {payment.amount && <span className="text-xs font-semibold text-foreground">{formatCurrency(payment.amount)}</span>}
                                                <span className="text-xs text-muted-foreground">{format(new Date(payment.submittedAt), "MMM dd, yyyy")}</span>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-1" />
                                    </Link>
                                    {/* Receipt row */}
                                    <div className="flex items-center gap-2 pt-1">
                                        {payment.receiptNumber ? (
                                            <a
                                                href={`/api/accountant/receipts/${payment.id}/download`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                                            >
                                                <Download className="h-3 w-3" /> Download Receipt
                                            </a>
                                        ) : payment.status === "APPROVED" ? (
                                            <button
                                                onClick={() => handleGenerateReceipt(payment.id)}
                                                disabled={generatingReceiptId === payment.id}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 disabled:opacity-50"
                                            >
                                                <FileText className="h-3 w-3" />
                                                {generatingReceiptId === payment.id ? "Generating…" : "Generate Receipt"}
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary footer */}
                        <div className="border-t border-border px-5 py-3 flex items-center justify-between bg-secondary/30 flex-wrap gap-2">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Receipt className="h-4 w-4" />
                                {payments.length} record{payments.length !== 1 ? "s" : ""} found
                            </div>
                            {totalApproved > 0 && (
                                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                    Total approved: {formatCurrency(totalApproved)}
                                </span>
                            )}
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );
}
