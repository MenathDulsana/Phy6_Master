import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, del, uploadFile, downloadUrl } from "@/lib/api-client";
import type { LearningMaterial } from "./types";

export function useMaterials(courseId: number | undefined, userId?: number) {
  return useQuery<LearningMaterial[]>({
    queryKey: ["materials", courseId, userId],
    queryFn: () => get<LearningMaterial[]>(`/api/courses/${courseId}/materials${userId ? `?userId=${userId}` : ""}`),
    enabled: !!courseId,
  });
}

export function useUploadMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      lessonId,
      title,
      type,
      file,
      linkUrl,
    }: {
      lessonId: number;
      title: string;
      type: string;
      file?: File;
      linkUrl?: string;
    }) => {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("type", type);
      if (type === "LINK" && linkUrl) {
        formData.append("url", linkUrl);
      } else if (file) {
        formData.append("file", file);
      }
      return uploadFile<LearningMaterial>(
        `/api/lessons/${lessonId}/materials/uploads`,
        formData
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["materials"] }),
  });
}

export function useDeleteMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => del(`/api/materials/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["materials"] }),
  });
}

export function useUpdateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title, type, file, linkUrl }: { id: number; title: string; type: string; file?: File; linkUrl?: string }) => {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("type", type);
      if (type === "LINK" && linkUrl !== undefined) {
        formData.append("url", linkUrl);
      } else if (file) {
        formData.append("file", file);
      }
      return uploadFile<LearningMaterial>(`/api/materials/${id}`, formData, "PUT");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["materials"] }),
  });
}

export function getMaterialDownloadUrl(materialId: number): string {
  return downloadUrl(`/api/materials/${materialId}/downloads`);
}
