import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, put, del } from "@/lib/api-client";
import type { TimetableSlot, TimetableSlotDTO } from "./types";

export function useTimetable() {
  return useQuery<TimetableSlot[]>({
    queryKey: ["timetable"],
    queryFn: () => get<TimetableSlot[]>("/api/timetable"),
  });
}

export function useTimetableForCourse(courseId: number | undefined, userId?: number) {
  return useQuery<TimetableSlot[]>({
    queryKey: ["timetable", "course", courseId, userId],
    queryFn: () => get<TimetableSlot[]>(`/api/timetable/course/${courseId}${userId ? `?userId=${userId}` : ""}`),
    enabled: !!courseId,
  });
}

export function useCreateTimetableSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: TimetableSlotDTO) =>
      post<TimetableSlot>("/api/timetable", dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["timetable"] }),
  });
}

export function useUpdateTimetableSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: TimetableSlotDTO & { id: number }) =>
      put<TimetableSlot>(`/api/timetable/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["timetable"] }),
  });
}

export function useDeleteTimetableSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => del(`/api/timetable/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["timetable"] }),
  });
}

// Helper: convert backend dayOfWeek ("MONDAY") to display day name
const DAY_NAMES: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

const DAY_ORDER: Record<string, number> = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6,
};

export function dayDisplayName(dayOfWeek: string): string {
  return DAY_NAMES[dayOfWeek] ?? dayOfWeek;
}

export function dayIndex(dayOfWeek: string): number {
  return DAY_ORDER[dayOfWeek] ?? 0;
}

// Convert "HH:mm:ss" or "HH:mm" to 12-hour format like "9:00 AM"
export function formatTime(time: string): string {
  const [hStr, mStr] = time.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr;
  const ampm = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${ampm}`;
}

// Convert "MONDAY" to integer (0=Mon…6=Sun) for grid placement
export function dayToGridIndex(dayOfWeek: string): number {
  return DAY_ORDER[dayOfWeek] ?? 0;
}
