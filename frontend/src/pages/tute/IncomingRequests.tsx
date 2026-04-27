import { MailCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIncomingTutorRequests } from "@/lib/api";

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

export default function IncomingRequests() {
  const { data, isLoading, isError } = useIncomingTutorRequests(0, 20);
  const requests = data?.content ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-display font-bold text-foreground">
          <MailCheck className="h-6 w-6 text-amber-500" />
          Incoming Requests
        </h1>
        <p className="mt-1 text-muted-foreground">Review and process tutorial requests</p>
      </div>

      <Card className="border-border shadow-card">
        <CardHeader className="pb-1">
          <CardTitle className="text-base">Requests Queue</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-6 text-sm text-muted-foreground">Loading incoming requests...</p>
          ) : isError ? (
            <p className="py-6 text-sm text-destructive">Failed to load incoming requests.</p>
          ) : requests.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">No incoming requests available.</p>
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
                  <TableHead className="text-right text-[11px] uppercase tracking-wide">Payment Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
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
                    <TableCell className="text-right">{renderPaymentBadge(request.paymentStatus)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
