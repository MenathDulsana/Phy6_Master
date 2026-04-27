import { useEffect, useMemo, useState } from "react";
import { CircleCheckBig } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  useAcceptIncomingTutorRequest,
  useDeclineIncomingTutorRequest,
  useIncomingTutorRequests,
  useActiveTutorRequests,
  useMarkTutorRequestDelivered,
  useTutorProfile,
} from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import type { TutorActiveRequest, TutorIncomingRequest } from "@/lib/api/tutor-management";

function formatRequestDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function renderPaymentBadge(status?: string) {
  const normalizedStatus = (status ?? "").toUpperCase();
  const paid = normalizedStatus === "PAID" || normalizedStatus === "APPROVED";
  return (
    <Badge
      className={
        paid
          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-300"
          : "bg-rose-100 text-rose-700 hover:bg-rose-100 dark:bg-rose-500/20 dark:text-rose-300"
      }
    >
      {paid ? "PAID" : "NOT PAID"}
    </Badge>
  );
}

function renderStatusBadge(status?: string) {
  const normalizedStatus = (status ?? "").toUpperCase();
  const isAccepted = normalizedStatus === "ACCEPTED" || normalizedStatus === "IN_PROGRESS";
  return (
    <Badge
      className={
        isAccepted
          ? "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/20 dark:text-amber-300"
          : normalizedStatus === "DECLINED"
            ? "bg-rose-100 text-rose-700 hover:bg-rose-100 dark:bg-rose-500/20 dark:text-rose-300"
            : "bg-muted text-muted-foreground hover:bg-muted"
      }
    >
      {normalizedStatus || "UNKNOWN"}
    </Badge>
  );
}

function getRequestedTuteTitle(description?: string) {
  if (!description) return "—";
  const firstLine = description.split("\n")[0].trim();
  const prefix = "Requested Tute:";
  return firstLine.toLowerCase().startsWith(prefix.toLowerCase())
    ? firstLine.slice(prefix.length).trim() || "—"
    : firstLine || "—";
}

function getRequestDescription(description?: string) {
  if (!description) return "—";
  const lines = description.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length <= 1) return "—";
  return lines.slice(1).join(" ");
}

export default function ActiveRequests() {
  const userId = Number(localStorage.getItem("authUserId")) || undefined;
  const navigate = useNavigate();
  const { data: incomingData, isLoading: incomingLoading, isError: incomingError } = useIncomingTutorRequests(0, 20);
  const {
    data: tutorProfile,
    isLoading: tutorProfileLoading,
    isError: tutorProfileError,
  } = useTutorProfile(userId);
  const { data: activeData, isLoading: activeLoading, isError: activeError } = useActiveTutorRequests(tutorProfile?.id, 0, 20);
  const acceptRequest = useAcceptIncomingTutorRequest();
  const declineRequest = useDeclineIncomingTutorRequest();
  const markDelivered = useMarkTutorRequestDelivered();
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [declineTargetId, setDeclineTargetId] = useState<number | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [trackedRequests, setTrackedRequests] = useState<
    Record<number, { request: TutorIncomingRequest | TutorActiveRequest; status: string }>
  >({});

  useEffect(() => {
    const nextRequests = incomingData?.content ?? [];
    if (nextRequests.length === 0) return;

    setTrackedRequests((current) => {
      const merged = { ...current };

      for (const request of nextRequests) {
        merged[request.id] = {
          request,
          status: merged[request.id]?.status ?? "PENDING",
        };
      }

      return merged;
    });
  }, [incomingData]);

  useEffect(() => {
    const nextRequests = activeData?.content ?? [];
    if (nextRequests.length === 0) return;

    setTrackedRequests((current) => {
      const merged = { ...current };

      for (const request of nextRequests) {
        merged[request.id] = {
          request,
          status: request.status ?? merged[request.id]?.status ?? "ACCEPTED",
        };
      }

      return merged;
    });
  }, [activeData]);

  const requests = useMemo(
    () =>
      Object.values(trackedRequests).sort((left, right) => {
        const leftTime = new Date(left.request.requestedDate ?? left.request.createdAt ?? 0).getTime();
        const rightTime = new Date(right.request.requestedDate ?? right.request.createdAt ?? 0).getTime();
        return rightTime - leftTime;
      }),
    [trackedRequests],
  );

  const handleAccept = async (requestId: number) => {
    if (!tutorProfile?.id) {
      toast.error("Unable to accept request: tutor profile not loaded");
      return;
    }

    try {
      await acceptRequest.mutateAsync({ requestId, tutorId: tutorProfile.id });
      setTrackedRequests((current) => ({
        ...current,
        [requestId]: { ...current[requestId], status: "ACCEPTED" },
      }));
      toast.success("Request accepted");
    } catch (error) {
      const msg =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Failed to accept request";
      toast.error(msg);
    }
  };

  const openDeclineDialog = (requestId: number) => {
    setDeclineTargetId(requestId);
    setDeclineReason("");
    setDeclineDialogOpen(true);
  };

  const handleDecline = async () => {
    if (declineTargetId === null) {
      return;
    }

    const reason = declineReason.trim();
    if (!reason) {
      toast.error("Please enter a reason for declining the request");
      return;
    }

    try {
      await declineRequest.mutateAsync({ requestId: declineTargetId, reason });
      setTrackedRequests((current) => ({
        ...current,
        [declineTargetId]: { ...current[declineTargetId], status: "DECLINED" },
      }));
      setDeclineDialogOpen(false);
      setDeclineTargetId(null);
      setDeclineReason("");
      toast.success("Request declined");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to decline request");
    }
  };

  const handleDelivered = async (requestId: number) => {
    try {
      await markDelivered.mutateAsync(requestId);
      setTrackedRequests((current) => {
        const next = { ...current };
        delete next[requestId];
        return next;
      });
      navigate("/tute/delivery-records");
      toast.success("Request marked as delivered");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to mark as delivered");
    }
  };

  const loading = incomingLoading || activeLoading || tutorProfileLoading;
  const hasError = incomingError || activeError;
  const mutating = acceptRequest.isPending || declineRequest.isPending || markDelivered.isPending;

  const tutorReady = !!tutorProfile?.id;
  const showTutorProfileWarning =
    !tutorProfileLoading && (tutorProfileError || !tutorReady);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-display font-bold text-foreground">
          <CircleCheckBig className="h-6 w-6 text-emerald-500" />
          Active Requests
        </h1>
        <p className="mt-1 text-muted-foreground">Review incoming requests, payment status, and delivery progress</p>
      </div>

      {showTutorProfileWarning && (
        <div
          role="alert"
          className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100"
        >
          <strong className="font-semibold">Tutor profile not found.</strong> Accept and Decline need a tutor record for
          your login. Restart the backend so the default tute manager seed can create it, or add a row in{" "}
          <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-900/40">tutors</code> linked to your user.
        </div>
      )}

      <Card className="border-border shadow-card">
        <CardHeader className="pb-1">
          <CardTitle className="text-base">Active Queue</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-6 text-sm text-muted-foreground">Loading requests...</p>
          ) : hasError ? (
            <p className="py-6 text-sm text-destructive">Failed to load requests.</p>
          ) : requests.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">No requests available.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[11px] uppercase tracking-wide">Date</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide">Student Name</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide">Student ID</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide">Course</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide">Tutorial Name</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide">Request Description</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide">Status</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide">Payment Status</TableHead>
                  <TableHead className="text-right text-[11px] uppercase tracking-wide">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map(({ request, status }) => (
                  <TableRow key={request.id}>
                    <TableCell className="text-muted-foreground">
                      {formatRequestDate(request.requestedDate ?? request.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium">{request.studentName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {request.studentCode || `STU-${request.studentId}`}
                    </TableCell>
                    <TableCell>{request.courseName}</TableCell>
                    <TableCell>{getRequestedTuteTitle(request.description)}</TableCell>
                    <TableCell className="text-muted-foreground">{getRequestDescription(request.description)}</TableCell>
                    <TableCell>{renderStatusBadge(status)}</TableCell>
                    <TableCell>{renderPaymentBadge(request.paymentStatus)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {status === "PENDING" && (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={mutating}
                              className="border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
                              onClick={() => openDeclineDialog(request.id)}
                            >
                              Decline
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              disabled={mutating || !tutorProfile?.id}
                              className="bg-emerald-600 text-emerald-50 hover:bg-emerald-700"
                              onClick={() => handleAccept(request.id)}
                            >
                              Accept
                            </Button>
                          </>
                        )}

                        {status === "ACCEPTED" && (
                          <Button
                            type="button"
                            size="sm"
                            disabled={mutating}
                            className="bg-amber-500 text-amber-50 hover:bg-amber-600"
                            onClick={() => handleDelivered(request.id)}
                          >
                            Mark as Delivered
                          </Button>
                        )}

                        {status === "DECLINED" && (
                          <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 dark:bg-rose-500/20 dark:text-rose-300">
                            Declined
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={declineDialogOpen}
        onOpenChange={(open) => {
          setDeclineDialogOpen(open);
          if (!open) {
            setDeclineTargetId(null);
            setDeclineReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline request</DialogTitle>
            <DialogDescription>Write the reason for declining this request.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="decline-reason">Reason</Label>
            <Textarea
              id="decline-reason"
              value={declineReason}
              onChange={(event) => setDeclineReason(event.target.value)}
              placeholder="Enter the decline reason"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeclineDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={declineRequest.isPending}
              className="bg-rose-600 text-rose-50 hover:bg-rose-700"
              onClick={handleDecline}
            >
              Decline Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
