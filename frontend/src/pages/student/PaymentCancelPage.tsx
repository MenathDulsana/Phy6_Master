import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { XCircle, RotateCcw, LayoutDashboard, AlertTriangle } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useWithdrawPayment } from "@/lib/api/students";

const PaymentCancelPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const withdrawMut = useWithdrawPayment();
  const [cleaned, setCleaned] = useState(false);
  const [cleanError, setCleanError] = useState<string | null>(null);

  const sessionId = searchParams.get("session_id");

  // Auto-cancel the abandoned Stripe session on the server so enrollment
  // goes back to PENDING and the student can re-submit cleanly.
  useEffect(() => {
    if (!sessionId || cleaned) return;
    withdrawMut.mutate(
      { stripeSessionId: sessionId },
      {
        onSuccess: () => setCleaned(true),
        onError: (err: unknown) => {
          // Not a hard failure — payment may have already been actioned or not found
          setCleanError(err instanceof Error ? err.message : null);
          setCleaned(true);
        },
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl border border-border bg-card shadow-lg p-8 space-y-6"
      >
        {/* Icon + heading */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="h-9 w-9 text-destructive" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Payment Cancelled</h1>
          <p className="text-sm text-muted-foreground">
            You left the Stripe checkout before completing payment. No charge was made to your card.
          </p>
        </div>

        {/* Status info */}
        <div className="rounded-xl border border-border bg-secondary/40 p-4 space-y-2 text-sm text-foreground">
          <p className="flex items-start gap-2">
            <span className="text-green-500 font-bold mt-0.5">✓</span>
            No charge has been made to your card.
          </p>
          <p className="flex items-start gap-2">
            {cleaned && !cleanError ? (
              <>
                <span className="text-green-500 font-bold mt-0.5">✓</span>
                Your enrollment has been reset — you can re-submit payment anytime.
              </>
            ) : (
              <>
                <span className="text-muted-foreground mt-0.5">•</span>
                Your enrollment is being reset to allow re-submission…
              </>
            )}
          </p>
        </div>

        {/* Optional warning if server cleanup failed */}
        {cleanError && (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 flex items-start gap-2 text-sm text-yellow-700 dark:text-yellow-400">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Could not automatically reset your enrollment ({cleanError}). You can still retry payment or contact support.
            </span>
          </div>
        )}

        {/* Session reference */}
        {sessionId && (
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground mb-1">Stripe Session Reference</p>
            <p className="text-xs font-mono text-foreground break-all">{sessionId}</p>
          </div>
        )}

        {/* Alternative methods note */}
        <div className="rounded-xl border border-border bg-secondary/40 p-4 text-sm">
          <p className="font-semibold text-foreground mb-2">Alternative Payment Methods</p>
          <ul className="space-y-1 text-muted-foreground text-xs">
            <li>• ATM Transfer — enter your reference number manually</li>
            <li>• Bank Slip Upload — upload a photo or PDF of your deposit slip</li>
            <li>• Try Stripe again with a different card</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full gradient-cta text-primary-foreground gap-2"
            onClick={() => navigate(-1)}
          >
            <RotateCcw className="h-4 w-4" />
            Retry Payment
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full gap-2"
            onClick={() => navigate("/student/dashboard")}
          >
            <LayoutDashboard className="h-4 w-4" />
            Go to Dashboard
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Need help? Contact our support team and quote the session reference above.
        </p>
      </motion.div>
    </div>
  );
};

export default PaymentCancelPage;
