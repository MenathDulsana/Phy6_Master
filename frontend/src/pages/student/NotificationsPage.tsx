import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useStudentNotifications, useMarkNotificationAsRead, type PaymentNotification } from "@/lib/api/notifications";
import { downloadStudentReceiptPdf } from "@/lib/api/students";
import {
    CheckCircle2,
    Info,
    XCircle,
    Check,
    Bell,
    FileText,
    RefreshCw,
    Download,
    Loader2,
    BookOpen,
    Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function formatRelativeTime(iso: string): string {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatFullTime(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

type NotifGroup = { key: string; items: PaymentNotification[] };

function groupNotifications(notifications: PaymentNotification[]): NotifGroup[] {
    const map = new Map<string, PaymentNotification[]>();
    for (const n of notifications) {
        const key = n.paymentId != null ? `p-${n.paymentId}` : `n-${n.id}`;
        const arr = map.get(key) ?? [];
        arr.push(n);
        map.set(key, arr);
    }
    const groups: NotifGroup[] = [];
    for (const [key, items] of map) {
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        groups.push({ key, items });
    }
    groups.sort(
        (a, b) => new Date(b.items[0].createdAt).getTime() - new Date(a.items[0].createdAt).getTime(),
    );
    return groups;
}

function sortNewestFirst(items: PaymentNotification[]): PaymentNotification[] {
    return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Same payment row can be reused after a rejection (resubmit). Older REJECTED alerts must not
 * override newer APPROVED / RECEIPT — we use the newest notification by time as "current" state.
 */
function groupPresentation(items: PaymentNotification[]): {
    title: string;
    body: string;
    tone: "success" | "danger" | "info";
    icon: "receipt" | "approved" | "rejected" | "info";
    hasStaleRejection: boolean;
} {
    const chronological = [...items].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const newest = chronological[chronological.length - 1];
    const course = newest.classReference?.trim() || items[0].classReference?.trim() || "Your class";

    const hasReceipt = items.some((i) => i.type === "RECEIPT");
    const hasApproved = items.some((i) => i.type === "APPROVED");
    const hadRejection = items.some((i) => i.type === "REJECTED");
    const hasStaleRejection = hadRejection && newest.type !== "REJECTED";

    const receipt =
        items.reduce<string | null>((acc, i) => acc ?? i.receiptNumber ?? null, null) ??
        (() => {
            const m = items.find((i) => i.type === "RECEIPT")?.message.match(/RCPT-\d{4}-\d{6}/);
            return m ? m[0] : null;
        })();

    if (newest.type === "REJECTED") {
        return {
            title: `Action needed — ${course}`,
            body: newest.message,
            tone: "danger",
            icon: "rejected",
            hasStaleRejection: false,
        };
    }

    if (hasReceipt && hasApproved) {
        let body = receipt
            ? `Your payment is approved. Official receipt ${receipt} is ready — use the button below to download your PDF.`
            : `Your payment is approved and your official receipt is ready — use the button below to download your PDF.`;
        if (hasStaleRejection) {
            body += " (Your earlier submission was rejected; this reflects your latest successful payment.)";
        }
        return {
            title: `Payment complete — ${course}`,
            body,
            tone: "success",
            icon: "receipt",
            hasStaleRejection,
        };
    }

    if (hasReceipt) {
        const r = items.find((i) => i.type === "RECEIPT")!;
        return {
            title: r.title,
            body: hasStaleRejection ? `${r.message} (Earlier rejection superseded by this receipt.)` : r.message,
            tone: "success",
            icon: "receipt",
            hasStaleRejection,
        };
    }

    if (hasApproved) {
        const newestApproved = sortNewestFirst(items).find((i) => i.type === "APPROVED")!;
        let body = newestApproved.message;
        if (hasStaleRejection) {
            body += " Your resubmission was approved — you can ignore the earlier rejection notice.";
        }
        return {
            title: `Payment approved — ${course}`,
            body,
            tone: "success",
            icon: "approved",
            hasStaleRejection,
        };
    }

    const icon =
        newest.type === "REJECTED"
            ? "rejected"
            : newest.type === "APPROVED"
              ? "approved"
              : newest.type === "RECEIPT"
                ? "receipt"
                : "info";
    const tone =
        newest.type === "REJECTED" ? "danger" : newest.type === "APPROVED" || newest.type === "RECEIPT" ? "success" : "info";
    return { title: newest.title, body: newest.message, tone, icon, hasStaleRejection };
}

function GroupIcon({ kind }: { kind: "receipt" | "approved" | "rejected" | "info" }) {
    const wrap = "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl";
    if (kind === "rejected")
        return (
            <div className={`${wrap} bg-destructive/10`}>
                <XCircle className="h-6 w-6 text-destructive" />
            </div>
        );
    if (kind === "approved")
        return (
            <div className={`${wrap} bg-emerald-500/15`}>
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
        );
    if (kind === "receipt")
        return (
            <div className={`${wrap} bg-sky-500/15`}>
                <FileText className="h-6 w-6 text-sky-600" />
            </div>
        );
    return (
        <div className={`${wrap} bg-primary/10`}>
            <Info className="h-6 w-6 text-primary" />
        </div>
    );
}

export default function NotificationsPage() {
    const studentId = Number(localStorage.getItem("authUserId")) || undefined;
    const { data: notifications = [], isLoading, isError, error, refetch, isFetching } = useStudentNotifications(studentId);
    const markAsReadMutation = useMarkNotificationAsRead();
    const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

    const groups = useMemo(() => groupNotifications(notifications), [notifications]);
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    const handleMarkGroupRead = async (items: PaymentNotification[]) => {
        if (!studentId) return;
        const unread = items.filter((i) => !i.isRead);
        if (unread.length === 0) return;
        try {
            for (const n of unread) {
                await markAsReadMutation.mutateAsync({ id: n.id, studentId });
            }
            toast.success("Marked as read");
        } catch {
            toast.error("Could not update notifications. Try again.");
        }
    };

    const handleDownload = async (groupKey: string, paymentId: number) => {
        if (!studentId) return;
        setDownloadingKey(groupKey);
        try {
            await downloadStudentReceiptPdf(paymentId, studentId);
            toast.success("Receipt downloaded");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Download failed");
        } finally {
            setDownloadingKey(null);
        }
    };

    const errorDetail = error instanceof Error ? error.message : "Could not reach the server.";

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-10">
            <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/15 p-6 sm:p-7 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="h-5 w-5 text-primary" />
                            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight">
                                Payment notify
                            </h1>
                        </div>
                        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-lg">
                            Payment and enrollment updates in one place. When your receipt is ready, download it directly
                            from the alert.
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <div className="shrink-0 inline-flex items-center gap-2 rounded-full bg-amber-500/15 border border-amber-500/25 px-3.5 py-1.5 text-sm">
                            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                            <span className="font-semibold text-foreground">{unreadCount} new</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="rounded-2xl bg-card shadow-sm border border-border overflow-hidden">
                {isLoading ? (
                    <div className="p-10 text-center text-muted-foreground">Loading your notifications…</div>
                ) : isError ? (
                    <div className="p-8 text-center space-y-4 max-w-lg mx-auto">
                        <p className="text-destructive font-medium">Failed to load notifications</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{errorDetail}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Usual causes: Spring Boot is not running on port 8080, MySQL is down, or use{" "}
                            <span className="font-mono text-foreground/80">http://localhost:5173</span> in dev.
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isFetching}
                            onClick={() => void refetch()}
                            className="gap-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                            Try again
                        </Button>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                            <Bell className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Nothing here yet</h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-sm leading-relaxed">
                            When your payment is reviewed or your receipt is issued, you&apos;ll see it here.
                        </p>
                        <Button asChild variant="outline" className="mt-6" size="sm">
                            <Link to="/student/classes">Browse classes</Link>
                        </Button>
                    </div>
                ) : (
                    <ul className="divide-y divide-border">
                        {groups.map(({ key, items }) => {
                            const sortedNewest = sortNewestFirst(items);
                            const { title, body, tone, icon } = groupPresentation(items);
                            const latest = sortedNewest[0];
                            const anyUnread = items.some((i) => !i.isRead);
                            const paymentId = items.find((i) => i.paymentId != null)?.paymentId ?? undefined;
                            const receiptNumber = items.reduce<string | null>(
                                (acc, i) => acc ?? i.receiptNumber ?? null,
                                null,
                            );
                            const currentlyRejected = latest.type === "REJECTED";
                            const canDownload =
                                studentId != null &&
                                paymentId != null &&
                                !!receiptNumber &&
                                !currentlyRejected;

                            const borderAccent =
                                tone === "danger"
                                    ? "border-l-destructive/70"
                                    : tone === "success"
                                      ? "border-l-emerald-500/60"
                                      : "border-l-sky-500/50";

                            return (
                                <motion.li
                                    key={key}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`list-none p-5 sm:p-6 border-l-[3px] ${borderAccent} ${
                                        anyUnread ? "bg-primary/[0.04]" : "bg-card"
                                    }`}
                                >
                                    <div className="flex gap-4">
                                        <GroupIcon kind={icon} />
                                        <div className="flex-1 min-w-0 space-y-3">
                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                <h2 className="text-base sm:text-lg font-semibold text-foreground leading-snug pr-2">
                                                    {title}
                                                </h2>
                                                <div className="text-right shrink-0">
                                                    <p className="text-xs font-medium text-muted-foreground">
                                                        {formatRelativeTime(latest.createdAt)}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground/80 mt-0.5" title={formatFullTime(latest.createdAt)}>
                                                        {formatFullTime(latest.createdAt)}
                                                    </p>
                                                </div>
                                            </div>

                                            <p className="text-sm text-foreground/90 leading-relaxed">{body}</p>

                                            {latest.classReference && (
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-secondary border border-border text-secondary-foreground">
                                                        <BookOpen className="h-3.5 w-3.5 opacity-70" />
                                                        {latest.classReference}
                                                    </span>
                                                    <Link
                                                        to="/student/classes"
                                                        className="text-xs font-medium text-primary hover:underline"
                                                    >
                                                        Open classes
                                                    </Link>
                                                </div>
                                            )}

                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
                                                {canDownload && (
                                                    <Button
                                                        type="button"
                                                        disabled={downloadingKey === key}
                                                        onClick={() => void handleDownload(key, paymentId!)}
                                                        className="w-full sm:w-auto rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 gap-2 h-10 px-4"
                                                    >
                                                        {downloadingKey === key ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Download className="h-4 w-4" />
                                                        )}
                                                        {downloadingKey === key ? "Preparing…" : "Download PDF"}
                                                    </Button>
                                                )}
                                                {anyUnread && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={markAsReadMutation.isPending}
                                                        onClick={() => void handleMarkGroupRead(items)}
                                                        className="w-full sm:w-auto rounded-xl gap-1.5 h-10"
                                                    >
                                                        <Check className="h-3.5 w-3.5" />
                                                        Mark as read
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
