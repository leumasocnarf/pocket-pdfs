import api from "./api.ts";
import type { FileResponse, UrlResponse } from "../types.ts";

export async function listFiles(): Promise<FileResponse[]> {
  return api.get<FileResponse[]>("/files");
}

export async function uploadFile(file: File): Promise<FileResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return api.post<FileResponse>("/files/upload", formData);
}

export async function getPreviewUrl(id: string): Promise<UrlResponse> {
  return api.get<UrlResponse>(`/files/${id}/preview`);
}

export async function getDownloadUrl(id: string): Promise<UrlResponse> {
  return api.get<UrlResponse>(`/files/${id}/download`);
}

export async function deleteFile(id: string): Promise<void> {
  await api.delete(`/files/${id}`);
}
