import { CheckCircle2, FileCheck2, Inbox, SquarePen } from "lucide-react";
import { useIncomingTutorRequests, useTutorDashboardStats } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

function isPaidStatus(status?: string) {
  const normalizedStatus = (status ?? "").toUpperCase();
  return normalizedStatus === "PAID" || normalizedStatus === "APPROVED";
}

function renderPaymentStatus(status?: string) {
  return isPaidStatus(status) ? "PAID" : "NOT PAID";
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

export default function TuteDashboard() {
  const managerName = localStorage.getItem("authName") || "Phy6 Master";
  const { data: stats } = useTutorDashboardStats();
  const { data, isLoading, isError } = useIncomingTutorRequests(0, 5);
  const statCards = [
    {
      label: "Incoming Requests",
      value: stats?.incomingRequests ?? 0,
      icon: Inbox,
      iconColor: "text-orange-500",
      iconBg: "bg-orange-100 dark:bg-orange-500/20",
    },
    {
      label: "Active Requests",
      value: stats?.activeRequests ?? 0,
      icon: CheckCircle2,
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-100 dark:bg-emerald-500/20",
    },
    {
      label: "Delivered",
      value: stats?.delivered ?? 0,
      icon: FileCheck2,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-100 dark:bg-blue-500/20",
    },
  ];
  const recentIncoming = [...(data?.content ?? [])].sort((left, right) => {
    const leftTime = new Date(left.requestedDate ?? left.createdAt ?? 0).getTime();
    const rightTime = new Date(right.requestedDate ?? right.createdAt ?? 0).getTime();
    return rightTime - leftTime;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Welcome back, {managerName}!</h1>
        <p className="mt-1 text-muted-foreground">Manage tutorial requests and track deliveries</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {statCards.map((card) => (
          <Card key={card.label} className="border-border shadow-card">
            <CardHeader className="pb-2">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.iconBg}`}>
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-foreground">{card.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <SquarePen className="h-4 w-4 text-amber-500" />
            Recent Incoming Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-6 text-sm text-muted-foreground">Loading recent requests...</p>
          ) : isError ? (
            <p className="py-6 text-sm text-destructive">Failed to load recent requests.</p>
          ) : recentIncoming.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">No recent requests available.</p>
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
                {recentIncoming.map((request) => (
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
                    <TableCell className="text-right">
                      <Badge
                        className={
                          isPaidStatus(request.paymentStatus)
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-700 hover:bg-rose-100 dark:bg-rose-500/20 dark:text-rose-300"
                        }
                      >
                        {renderPaymentStatus(request.paymentStatus)}
                      </Badge>
                    </TableCell>
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
