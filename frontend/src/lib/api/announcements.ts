import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, post, put, del } from "@/lib/api-client";
import type { Announcement } from "./types";

export function useAnnouncementsByCourse(courseId: number | undefined) {
  return useQuery<Announcement[]>({
    queryKey: ["announcements-by-course", courseId],
    queryFn: () => get<Announcement[]>(`/api/announcements/course/${courseId}`),
    enabled: !!courseId,
  });
}

export function useAnnouncementsByTeacher(teacherId: number | undefined) {
  return useQuery<Announcement[]>({
    queryKey: ["announcements-by-teacher", teacherId],
    queryFn: () => get<Announcement[]>(`/api/announcements/teacher/${teacherId}`),
    enabled: !!teacherId,
  });
}

export function useAnnouncementsForStudent(userId: number | undefined) {
  return useQuery<Announcement[]>({
    queryKey: ["announcements-for-student", userId],
    queryFn: () => get<Announcement[]>(`/api/announcements/student/${userId}`),
    enabled: !!userId,
  });
}

export function useAnnouncements(announcementId: number | undefined) {
  return useQuery<Announcement>({
    queryKey: ["announcement", announcementId],
    queryFn: () => get<Announcement>(`/api/announcements/${announcementId}`),
    enabled: !!announcementId,
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      courseId: number;
      teacherId: number;
      title: string;
      content: string;
    }) => {
      return post<Announcement>("/api/announcements", data);
    },
    onSuccess: (createdAnnouncement: Announcement) => {
      queryClient.invalidateQueries({ queryKey: ["announcements-by-course", createdAnnouncement.courseId] });
      queryClient.invalidateQueries({ queryKey: ["announcements-by-teacher", createdAnnouncement.teacherId] });
      queryClient.invalidateQueries({ queryKey: ["announcements-for-student"] });
    },
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: number;
      teacherId: number;
      title: string;
      content: string;
    }) => {
      return put<Announcement>(`/api/announcements/${data.id}`, {
        teacherId: data.teacherId,
        title: data.title,
        content: data.content,
      });
    },
    onSuccess: (updatedAnnouncement: Announcement) => {
      queryClient.invalidateQueries({ queryKey: ["announcement", updatedAnnouncement.id] });
      queryClient.invalidateQueries({ queryKey: ["announcements-by-course", updatedAnnouncement.courseId] });
      queryClient.invalidateQueries({ queryKey: ["announcements-by-teacher", updatedAnnouncement.teacherId] });
      queryClient.invalidateQueries({ queryKey: ["announcements-for-student"] });
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: number; teacherId: number }) => {
      return del<void>(`/api/announcements/${data.id}?teacherId=${data.teacherId}`);
    },
    onSuccess: () => {
     
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      queryClient.invalidateQueries({ queryKey: ["announcements-by-course"] });
      queryClient.invalidateQueries({ queryKey: ["announcements-by-teacher"] });
      queryClient.invalidateQueries({ queryKey: ["announcements-for-student"] });
    },
  });
}
