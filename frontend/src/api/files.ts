import api from "./api.ts";
import type { FileResponse, UrlResponse } from "../types.ts";

export async function listFiles(): Promise<FileResponse[]> {
  const response = await api.get<FileResponse[]>("/files");
  return response.data;
}

export async function uploadFile(file: File): Promise<FileResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post<FileResponse>("/files/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function getPreviewUrl(id: string): Promise<UrlResponse> {
  const response = await api.get<UrlResponse>(`/files/${id}/preview`);
  return response.data;
}

export async function getDownloadUrl(id: string): Promise<UrlResponse> {
  const response = await api.get<UrlResponse>(`/files/${id}/download`);
  return response.data;
}

export async function deleteFile(id: string): Promise<void> {
  await api.delete(`/files/${id}`);
}
