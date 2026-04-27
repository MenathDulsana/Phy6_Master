import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { usePaymentDetail, useApprovePayment, useRejectPayment, useGenerateReceipt } from "@/lib/api/accountant-payments";
import {
    ChevronLeft, Check, X, Building2, CreditCard, Banknote,
    AlertCircle, FileText, Download, ShieldCheck, ExternalLink,
    User, Mail, BookOpen, Clock, Hash, Receipt,
} from "lucide-react";
import { toast } from "sonner";

function proofFileUrl(filePath: string): string {
    const filename = filePath.replace(/\\/g, "/").split("/").pop() ?? filePath;
    return `/api/files/${encodeURIComponent(filename)}`;
}

function isPdf(filePath: string): boolean {
    return filePath.toLowerCase().endsWith(".pdf");
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <div className="text-sm font-semibold text-foreground mt-0.5 break-words">{value}</div>
            </div>
        </div>
    );
}

function MethodIcon({ method }: { method: string }) {
    if (method === "ONLINE_PAYMENT") return <CreditCard className="h-4 w-4" />;
    if (method === "ATM_TRANSFER") return <Banknote className="h-4 w-4" />;
    return <Building2 className="h-4 w-4" />;
}

function StatusChip({ status }: { status: string }) {
    if (status === "APPROVED")
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <Check className="h-3.5 w-3.5" /> Approved
            </span>
        );
    if (status === "REJECTED")
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20">
                <X className="h-3.5 w-3.5" /> Rejected
            </span>
        );
    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <Clock className="h-3.5 w-3.5" /> Awaiting Review
        </span>
    );
}

export default function PaymentVerificationDetail() {
    const { paymentId } = useParams();
    const navigate = useNavigate();
    const { data: detail, isLoading, isError } = usePaymentDetail(paymentId);
    const approveMutation = useApprovePayment();
    const rejectMutation = useRejectPayment();
    const generateReceiptMutation = useGenerateReceipt();

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [rejectError, setRejectError] = useState("");
    const [receiptSuccess, setReceiptSuccess] = useState("");
    const [proofImageError, setProofImageError] = useState(false);

    const handleApprove = () => {
        approveMutation.mutate(detail!.id, {
            onSuccess: () => {
                toast.success("Payment approved! Receipt has been generated.");
                // Stay on page so the receipt section is immediately visible after data refetches
            },
            onError: (err: unknown) => {
                toast.error(err instanceof Error ? err.message : "Failed to approve payment");
            },
        });
    };

    const submitReject = () => {
        if (!rejectionReason.trim()) {
            setRejectError("Please provide a reason for rejection.");
            return;
        }
        rejectMutation.mutate({ paymentId: detail!.id, reason: rejectionReason }, {
            onSuccess: () => {
                toast.success("Payment rejected. Student has been notified.");
                navigate("/accountant/payments");
            },
            onError: (err: unknown) => {
                setRejectError(err instanceof Error ? err.message : "Failed to reject payment");
            },
        });
    };

    const handleGenerateReceipt = () => {
        generateReceiptMutation.mutate(detail!.id, {
            onSuccess: () => {
                setReceiptSuccess("Official receipt issued and available for download.");
                toast.success("Receipt generated successfully!");
            },
            onError: (err: unknown) => {
                toast.error(err instanceof Error ? err.message : "Failed to generate receipt");
            },
        });
    };

    if (isLoading) {
        return (
            <div className="max-w-5xl mx-auto space-y-4 pb-12">
                <div className="h-8 w-48 rounded-lg bg-secondary animate-pulse" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="h-80 rounded-xl bg-secondary animate-pulse" />
                    <div className="lg:col-span-2 h-80 rounded-xl bg-secondary animate-pulse" />
                </div>
            </div>
        );
    }

    if (isError || !detail) {
        return (
            <div className="max-w-5xl mx-auto">
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-12 flex flex-col items-center text-center">
                    <AlertCircle className="h-12 w-12 text-destructive/60 mb-3" />
                    <h3 className="font-semibold text-lg text-destructive">Payment not found</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">
                        This payment could not be loaded. It may have been deleted or the ID is invalid.
                    </p>
                    <Link to="/accountant/payments"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors">
                        <ChevronLeft className="h-4 w-4" /> Back to Pending
                    </Link>
                </div>
            </div>
        );
    }

    const isStripe = detail.paymentMethod === "ONLINE_PAYMENT";
    const needsReceipt = isStripe && detail.status === "APPROVED" && !detail.receiptNumber;
    const isApproved = detail.status === "APPROVED";

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            {/* Breadcrumb + header */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-3 mb-4">
                    <Link
                        to="/accountant/payments"
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" /> Pending Verifications
                    </Link>
                    {isApproved && (
                        <>
                            <span className="text-muted-foreground/40">·</span>
                            <Link
                                to="/accountant/payments/history"
                                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline transition-colors"
                            >
                                View in Payment History
                            </Link>
                        </>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-display font-bold text-foreground">Review Payment</h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            {isStripe && detail.status === "APPROVED" && !detail.receiptNumber
                                ? "Stripe payment confirmed. Issue the official receipt below — the student's enrollment becomes fully active and they are notified once the receipt is generated."
                                : isStripe && detail.status === "APPROVED" && detail.receiptNumber
                                ? "Receipt issued — the student can download the PDF from their Notifications page."
                                : isStripe && detail.status === "SUBMITTED"
                                ? "Stripe payment submitted — approve to generate a receipt and confirm enrollment."
                                : detail.status === "REJECTED"
                                ? "This payment was rejected. The student has been notified."
                                : "Review the proof of payment and approve or reject this submission."}
                        </p>
                    </div>
                    <StatusChip status={detail.status} />
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left sidebar — info */}
                <motion.div
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.06 }}
                    className="space-y-4"
                >
                    {/* Student info */}
                    <div className="rounded-xl bg-card border border-border shadow-card p-5 space-y-4">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Student</h3>
                        <InfoRow icon={User} label="Name" value={detail.studentName} />
                        <InfoRow icon={Mail} label="Email" value={detail.studentEmail || "Not provided"} />
                        <InfoRow icon={BookOpen} label="Course" value={detail.courseName} />
                    </div>

                    {/* Payment info */}
                    <div className="rounded-xl bg-card border border-border shadow-card p-5 space-y-4">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Payment</h3>
                        <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-primary font-bold text-xs">Rs</span>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Amount</p>
                                <p className="text-xl font-bold text-primary mt-0.5">
                                    {new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(detail.amount)}
                                </p>
                            </div>
                        </div>
                        <InfoRow
                            icon={detail.paymentMethod === "ONLINE_PAYMENT" ? CreditCard : detail.paymentMethod === "ATM_TRANSFER" ? Banknote : Building2}
                            label="Method"
                            value={detail.paymentMethod.replace(/_/g, " ")}
                        />
                        {detail.referenceNumber && (
                            <InfoRow icon={Hash} label="Reference" value={
                                <span className="font-mono text-xs">{detail.referenceNumber}</span>
                            } />
                        )}
                        <InfoRow icon={Clock} label="Submitted" value={new Date(detail.submissionDate).toLocaleString()} />
                    </div>

                    {/* Rejection reason (if rejected) */}
                    {detail.status === "REJECTED" && detail.rejectionReason && (
                        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                            <p className="text-xs font-bold text-destructive uppercase tracking-wide mb-2">Rejection Reason</p>
                            <p className="text-sm text-foreground">{detail.rejectionReason}</p>
                        </div>
                    )}
                </motion.div>

                {/* Right — proof + actions */}
                <motion.div
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2 flex flex-col gap-5"
                >
                    {/* Proof panel */}
                    <div className="rounded-xl bg-card border border-border shadow-card p-5 flex flex-col flex-1">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-4">Proof of Payment</h3>

                        <div className="flex-1 bg-secondary/30 rounded-xl flex items-center justify-center border border-border overflow-hidden min-h-[380px]">
                            {isStripe ? (
                                <div className="text-center p-8 max-w-sm mx-auto">
                                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                                        <ShieldCheck className="h-10 w-10 text-emerald-500" />
                                    </div>
                                    <p className="text-foreground font-bold text-lg">Verified by Stripe</p>
                                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                        This payment was completed online via Stripe Checkout. No manual proof required.
                                    </p>
                                    {detail.referenceNumber && (
                                        <p className="text-xs font-mono bg-secondary/80 rounded-lg px-3 py-2 mt-4 text-muted-foreground break-all">
                                            Session: {detail.referenceNumber}
                                        </p>
                                    )}
                                </div>
                            ) : detail.hasProof && detail.proofFilePath ? (
                                isPdf(detail.proofFilePath) ? (
                                    <div className="w-full h-full flex flex-col min-h-[500px] p-2">
                                        <iframe
                                            src={proofFileUrl(detail.proofFilePath)}
                                            title="Payment Proof PDF"
                                            className="w-full flex-1 min-h-[460px] rounded-lg border-0"
                                        />
                                        <a
                                            href={proofFileUrl(detail.proofFilePath)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-3 mx-auto inline-flex items-center gap-2 text-sm text-primary hover:underline"
                                        >
                                            <ExternalLink className="h-4 w-4" /> Open in new tab
                                        </a>
                                    </div>
                                ) : proofImageError ? (
                                    <div className="text-center p-8">
                                        <AlertCircle className="h-12 w-12 text-destructive/40 mx-auto mb-3" />
                                        <p className="text-destructive font-medium">Could not load image</p>
                                        <a
                                            href={proofFileUrl(detail.proofFilePath)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                                        >
                                            <ExternalLink className="h-4 w-4" /> Open file directly
                                        </a>
                                    </div>
                                ) : (
                                    <img
                                        src={proofFileUrl(detail.proofFilePath)}
                                        alt="Payment Proof"
                                        className="max-w-full max-h-[580px] object-contain rounded-lg"
                                        onError={() => setProofImageError(true)}
                                    />
                                )
                            ) : (
                                <div className="text-center p-8">
                                    <AlertCircle className="h-12 w-12 text-muted-foreground/25 mx-auto mb-3" />
                                    <p className="text-foreground font-medium">No proof uploaded</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        This payment was submitted without an attachment.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Action area */}
                        {detail.status === "SUBMITTED" && (
                            <div className="flex flex-col sm:flex-row gap-3 mt-5 pt-5 border-t border-border">
                                <button
                                    onClick={() => setShowRejectModal(true)}
                                    disabled={approveMutation.isPending || rejectMutation.isPending}
                                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-destructive/50 text-destructive font-semibold hover:bg-destructive/10 transition-colors disabled:opacity-50"
                                >
                                    <X className="h-5 w-5" /> Reject
                                </button>
                                <button
                                    onClick={handleApprove}
                                    disabled={approveMutation.isPending || rejectMutation.isPending}
                                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all active:scale-[0.98] shadow-md disabled:opacity-50"
                                >
                                    <Check className="h-5 w-5" />
                                    {approveMutation.isPending ? "Approving..." : "Approve & Issue Receipt"}
                                </button>
                            </div>
                        )}

                        {detail.status === "APPROVED" && (
                            <div className="mt-5 pt-5 border-t border-border space-y-3">
                                {receiptSuccess && (
                                    <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                                        <ShieldCheck className="h-4 w-4 shrink-0" /> {receiptSuccess}
                                    </div>
                                )}
                                {!detail.receiptNumber ? (
                                    <button
                                        onClick={handleGenerateReceipt}
                                        disabled={generateReceiptMutation.isPending}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold shadow-md hover:bg-emerald-700 transition-all active:scale-[0.98] disabled:opacity-60"
                                    >
                                        <FileText className="h-5 w-5" />
                                        {generateReceiptMutation.isPending
                                            ? "Generating Receipt..."
                                            : "Issue Official Receipt"}
                                    </button>
                                ) : (
                                    <div className="flex items-center justify-between p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                        <div className="flex items-center gap-3">
                                            <Receipt className="h-5 w-5 text-emerald-600" />
                                            <div>
                                                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Receipt Issued</p>
                                                <p className="font-mono text-sm text-foreground font-semibold">{detail.receiptNumber}</p>
                                            </div>
                                        </div>
                                        <a
                                            href={`/api/accountant/receipts/${detail.id}/download`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
                                        >
                                            <Download className="h-4 w-4" /> Download PDF
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}

                        {detail.status === "REJECTED" && (
                            <div className="mt-5 pt-5 border-t border-border">
                                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm font-medium">
                                    <X className="h-4 w-4 shrink-0" />
                                    This submission was rejected. The student has been notified.
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Reject Modal */}
            <AnimatePresence>
                {showRejectModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => { setShowRejectModal(false); setRejectError(""); setRejectionReason(""); }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card rounded-2xl w-full max-w-md shadow-2xl border border-border overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                                        <X className="h-5 w-5 text-destructive" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-foreground">Reject Payment</h2>
                                        <p className="text-xs text-muted-foreground">The student will receive a notification.</p>
                                    </div>
                                </div>

                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                                    Reason for rejection <span className="text-destructive">*</span>
                                </label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => { setRejectionReason(e.target.value); setRejectError(""); }}
                                    placeholder="e.g. The bank slip is blurry and illegible. Please resubmit with a clearer image."
                                    rows={4}
                                    className="w-full p-3 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-sm resize-none"
                                />
                                {rejectError && (
                                    <p className="text-sm text-destructive mt-2 flex items-center gap-1.5">
                                        <AlertCircle className="h-3.5 w-3.5" /> {rejectError}
                                    </p>
                                )}
                            </div>

                            <div className="bg-secondary/30 px-6 py-4 flex justify-end gap-3 border-t border-border">
                                <button
                                    onClick={() => { setShowRejectModal(false); setRejectError(""); setRejectionReason(""); }}
                                    disabled={rejectMutation.isPending}
                                    className="px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitReject}
                                    disabled={rejectMutation.isPending || !rejectionReason.trim()}
                                    className="px-5 py-2 bg-destructive text-destructive-foreground font-semibold text-sm rounded-lg hover:bg-destructive/90 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                                >
                                    <X className="h-4 w-4" />
                                    {rejectMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
