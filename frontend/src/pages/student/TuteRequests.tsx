import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileText, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { get } from "@/lib/api-client";
import {
  useCancelStudentTutorRequest,
  useCreateStudentTutorRequest,
  useStudentTutorRequests,
} from "@/lib/api";
import { useAllEnrollments } from "@/lib/api/students";
import type { LearningMaterial } from "@/lib/api";

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function getMaterialDisplayName(material: LearningMaterial) {
  const title = material.title?.trim();
  if (title) return title;
  const source = material.url ?? "";
  const normalized = source.replaceAll("\\", "/");
  const parts = normalized.split("/");
  return parts[parts.length - 1] || "Untitled tute";
}

function getRequestedTuteTitle(description?: string) {
  if (!description) return "";
  const firstLine = description.split("\n")[0].trim();
  const prefix = "Requested Tute:";
  return firstLine.toLowerCase().startsWith(prefix.toLowerCase())
    ? firstLine.slice(prefix.length).trim()
    : firstLine;
}

function makeTuteKey(courseName?: string, tuteTitle?: string) {
  return `${courseName ?? ""}::${tuteTitle ?? ""}`.trim().toLowerCase();
}

function statusBadge(status?: string) {
  const value = (status ?? "").toUpperCase();
  const label = value === "COMPLETED" ? "DELIVERED" : value || "UNKNOWN";
  const style =
    value === "PENDING"
      ? "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/20 dark:text-amber-300"
      : value === "ACCEPTED" || value === "IN_PROGRESS"
        ? "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-500/20 dark:text-blue-300"
        : value === "COMPLETED"
          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-300"
          : value === "REJECTED" || value === "CANCELLED"
            ? "bg-rose-100 text-rose-700 hover:bg-rose-100 dark:bg-rose-500/20 dark:text-rose-300"
            : "bg-muted text-muted-foreground";
  return <Badge className={style}>{label}</Badge>;
}

export default function TuteRequests() {
  const studentId = Number(localStorage.getItem("authUserId")) || undefined;
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [description, setDescription] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  const { data: enrollments = [] } = useAllEnrollments(studentId);
  const activeEnrollments = useMemo(() => {
    const ok = new Set(["ACTIVE", "APPROVED", "PAYMENT_SUBMITTED"]);
    return enrollments.filter((e) => ok.has((e.status ?? "").toUpperCase()));
  }, [enrollments]);

  const materialsQueries = useQueries({
    queries: activeEnrollments.map((enrollment) => ({
      queryKey: ["student-course-materials", studentId, enrollment.courseId],
      queryFn: () =>
        get<LearningMaterial[]>(`/api/courses/${enrollment.courseId}/materials?userId=${studentId}`),
      enabled: !!studentId,
    })),
  });

  const tuteMaterialOptions = useMemo(() => {
    return activeEnrollments
      .flatMap((enrollment, index) => {
        const materials = materialsQueries[index]?.data ?? [];
        return materials
          .filter(
            (material) =>
              (material.type === "PDF" || material.type === "NOTE") &&
              material.id != null &&
              Number.isFinite(Number(material.id)),
          )
          .map((material) => ({
            // Composite value so Radix Select stays unique when switching classes (same material id in different courses).
            value: `${enrollment.courseId}-${material.id}`,
            courseId: String(enrollment.courseId),
            courseName: enrollment.courseName,
            materialTitle: getMaterialDisplayName(material),
          }));
      })
      .sort((a, b) => `${a.courseName} ${a.materialTitle}`.localeCompare(`${b.courseName} ${b.materialTitle}`));
  }, [activeEnrollments, materialsQueries]);

  const classOptions = useMemo(
    () =>
      activeEnrollments
        .map((enrollment) => ({ value: String(enrollment.courseId), label: enrollment.courseName }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [activeEnrollments],
  );

  const filteredTuteOptions = useMemo(
    () =>
      selectedCourseId
        ? tuteMaterialOptions.filter((option) => option.courseId === selectedCourseId)
        : [],
    [selectedCourseId, tuteMaterialOptions],
  );

  const selectedOption = useMemo(
    () => filteredTuteOptions.find((option) => option.value === selectedMaterial),
    [selectedMaterial, filteredTuteOptions],
  );

  const loadingMaterials = materialsQueries.some((query) => query.isLoading);

  const { data, isLoading, isError } = useStudentTutorRequests(studentId, 0, 25);
  const createRequest = useCreateStudentTutorRequest(studentId);
  const cancelRequest = useCancelStudentTutorRequest(studentId);

  const rows = data?.content ?? [];
  const requestedTuteKeys = useMemo(
    () =>
      new Set(
        rows.map((row) =>
          makeTuteKey(row.courseName, getRequestedTuteTitle(row.description)),
        ),
      ),
    [rows],
  );
  const selectedTuteKey = selectedOption ? makeTuteKey(selectedOption.courseName, selectedOption.materialTitle) : "";
  const isDuplicateSelection = !!selectedTuteKey && requestedTuteKeys.has(selectedTuteKey);
  const isSubmitting = createRequest.isPending || cancelRequest.isPending;

  const canSubmit = useMemo(
    () => !!selectedOption && !isDuplicateSelection,
    [isDuplicateSelection, selectedOption],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      toast.error("Please select a tute");
      return;
    }

    if (!selectedOption) {
      toast.error("Please select a tute");
      return;
    }

    if (isDuplicateSelection) {
      toast.error("You have already requested this tute");
      return;
    }

    try {
      await createRequest.mutateAsync({
        courseName: selectedOption.courseName,
        description: `Requested Tute: ${selectedOption.materialTitle}\n${description.trim()}`,
      });
      setSelectedCourseId("");
      setSelectedMaterial("");
      setDescription("");
      toast.success("Tutor request submitted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit tutor request");
    }
  };

  const handleCancel = async (requestId: number) => {
    try {
      await cancelRequest.mutateAsync({
        requestId,
        reason: cancelReason.trim() || "Cancelled by student",
      });
      toast.success("Tutor request cancelled");
      setCancelReason("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to cancel request");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-display font-bold text-foreground">
          <FileText className="h-6 w-6 text-primary" />
          Tute Requests
        </h1>
        <p className="mt-1 text-muted-foreground">Submit and track your individual tute requests</p>
      </div>

      <Card className="border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-base">New Request</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Class (from your enrolled classes)</label>
              <Select
                value={selectedCourseId}
                onValueChange={(value) => {
                  setSelectedCourseId(value);
                  setSelectedMaterial("");
                }}
                disabled={isSubmitting || classOptions.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      classOptions.length === 0
                        ? "No enrolled classes available"
                        : "Select a class"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {classOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Tute</label>
              <Select
                value={selectedMaterial}
                onValueChange={setSelectedMaterial}
                disabled={
                  isSubmitting || loadingMaterials || !selectedCourseId || filteredTuteOptions.length === 0
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !selectedCourseId
                        ? "Select a class first"
                        : loadingMaterials
                          ? "Loading available tutes..."
                          : filteredTuteOptions.length === 0
                            ? "No tutes available for selected class"
                            : "Select a tute"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredTuteOptions.map((option) => {
                    const alreadyRequested = requestedTuteKeys.has(
                      makeTuteKey(option.courseName, option.materialTitle),
                    );
                    const label = alreadyRequested
                      ? `${option.materialTitle} (already requested)`
                      : option.materialTitle;
                    return (
                      <SelectItem key={option.value} value={option.value} textValue={option.materialTitle}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {!loadingMaterials && selectedCourseId && filteredTuteOptions.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Available tutes ({filteredTuteOptions.length}):{" "}
                  {filteredTuteOptions.map((option) => option.materialTitle).join(", ")}
                </p>
              )}
              {isDuplicateSelection && (
                <p className="text-xs text-rose-600">You have already requested this tute.</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Request Description (optional)</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you need help with"
                rows={4}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={!canSubmit || isSubmitting} className="gradient-cta text-primary-foreground gap-2">
                <Send className="h-4 w-4" />
                {createRequest.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border shadow-card">
        <CardHeader>
          <CardTitle className="text-base">My Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
            <Input
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Optional cancel reason (applies when you click Cancel)"
              disabled={isSubmitting}
            />
          </div>

          {isLoading ? (
            <p className="py-6 text-sm text-muted-foreground">Loading requests...</p>
          ) : isError ? (
            <p className="py-6 text-sm text-destructive">Failed to load requests.</p>
          ) : rows.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">No tutor requests yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const normalized = (row.status ?? "").toUpperCase();
                  const cancellable = normalized === "PENDING" || normalized === "ACCEPTED";
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.courseName}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[320px] truncate">{row.description}</TableCell>
                      <TableCell>{statusBadge(row.status)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(row.requestedDate ?? row.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!cancellable || isSubmitting}
                          onClick={() => handleCancel(row.id)}
                          className="border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
                        >
                          Cancel
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
