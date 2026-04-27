import { FileCheck2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTutorDeliveryRecords } from "@/lib/api";

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export default function DeliveryRecords() {
  const { data, isLoading, isError } = useTutorDeliveryRecords(0, 20);
  const records = data?.content ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-display font-bold text-foreground">
          <FileCheck2 className="h-6 w-6 text-indigo-500" />
          Delivery Records
        </h1>
        <p className="mt-1 text-muted-foreground">History of delivered tutorials</p>
      </div>

      <Card className="border-border shadow-card">
        <CardHeader className="pb-1">
          <CardTitle className="text-base">Delivered Tutorials</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-6 text-sm text-muted-foreground">Loading delivery records...</p>
          ) : isError ? (
            <p className="py-6 text-sm text-destructive">Failed to load delivery records.</p>
          ) : records.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">No delivery records available.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[11px] uppercase tracking-wide">Date</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide">Student Name</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide">Student ID</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide">Course</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wide">Tutorial Name</TableHead>
                  <TableHead className="text-right text-[11px] uppercase tracking-wide">Delivery Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="text-muted-foreground">
                      {formatDate(record.completedDate ?? record.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium">{record.studentName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {record.studentCode || `STU-${record.studentId}`}
                    </TableCell>
                    <TableCell>{record.courseName}</TableCell>
                    <TableCell className="text-muted-foreground">{record.description}</TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-300">
                        DELIVERED
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
