import { describe, it, expect, vi, beforeEach } from "vitest";
import api from "./api.ts";
import {
  listFiles,
  uploadFile,
  getPreviewUrl,
  getDownloadUrl,
  deleteFile,
} from "./files.ts";
import type { FileResponse, UrlResponse, ApiError } from "../types.ts";

vi.mock("./api.ts", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedGet = api.get as ReturnType<typeof vi.fn>;
const mockedPost = api.post as ReturnType<typeof vi.fn>;
const mockedDelete = api.delete as ReturnType<typeof vi.fn>;

const mockFile: FileResponse = {
  id: "file-123",
  filename: "document.pdf",
  size: 1024,
  contentType: "application/pdf",
  uploadedAt: "2024-01-01T00:00:00Z",
};

const mockUrlResponse: UrlResponse = {
  id: "file-123",
  filename: "document.pdf",
  url: "https://storage.example.com/signed-url",
};

const mockApiError: ApiError = {
  status: 404,
  error: "Not Found",
  message: "The requested file does not exist",
  timestamp: "2024-01-01T00:00:00Z",
};

describe("files api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listFiles", () => {
    it("calls GET /files and returns data", async () => {
      mockedGet.mockResolvedValueOnce({ data: [mockFile] });

      const result = await listFiles();

      expect(mockedGet).toHaveBeenCalledOnce();
      expect(mockedGet).toHaveBeenCalledWith("/files");
      expect(result).toEqual([mockFile]);
    });

    it("returns an empty array when there are no files", async () => {
      mockedGet.mockResolvedValueOnce({ data: [] });

      const result = await listFiles();

      expect(result).toEqual([]);
    });

    it("throws when the request fails", async () => {
      mockedGet.mockRejectedValueOnce(mockApiError);

      await expect(listFiles()).rejects.toMatchObject({
        status: 404,
        error: "Not Found",
      });
    });
  });

  describe("uploadFile", () => {
    it("calls POST /files/upload with correct FormData and headers", async () => {
      mockedPost.mockResolvedValueOnce({ data: mockFile });
      const file = new File(["content"], "document.pdf", {
        type: "application/pdf",
      });

      const result = await uploadFile(file);

      expect(mockedPost).toHaveBeenCalledOnce();
      const [url, body, config] = mockedPost.mock.calls[0];
      expect(url).toBe("/files/upload");
      expect(body).toBeInstanceOf(FormData);
      expect(body.get("file")).toBe(file);
      expect(config).toEqual({
        headers: { "Content-Type": "multipart/form-data" },
      });
      expect(result).toEqual(mockFile);
    });

    it("returns a FileResponse with correct shape on success", async () => {
      mockedPost.mockResolvedValueOnce({ data: mockFile });
      const file = new File(["content"], "document.pdf", {
        type: "application/pdf",
      });

      const result = await uploadFile(file);

      expect(result).toMatchObject<FileResponse>({
        id: expect.any(String),
        filename: expect.any(String),
        size: expect.any(Number),
        contentType: expect.any(String),
        uploadedAt: expect.any(String),
      });
    });

    it("throws when the upload fails", async () => {
      mockedPost.mockRejectedValueOnce(mockApiError);
      const file = new File(["content"], "document.pdf", {
        type: "application/pdf",
      });

      await expect(uploadFile(file)).rejects.toMatchObject({
        status: 404,
        error: "Not Found",
      });
    });
  });

  describe("getPreviewUrl", () => {
    it("calls GET /files/:id/preview and returns a UrlResponse", async () => {
      mockedGet.mockResolvedValueOnce({ data: mockUrlResponse });

      const result = await getPreviewUrl("file-123");

      expect(mockedGet).toHaveBeenCalledWith("/files/file-123/preview");
      expect(result).toEqual(mockUrlResponse);
    });

    it("returned url response has correct shape", async () => {
      mockedGet.mockResolvedValueOnce({ data: mockUrlResponse });

      const result = await getPreviewUrl("file-123");

      expect(result).toMatchObject<UrlResponse>({
        id: expect.any(String),
        filename: expect.any(String),
        url: expect.any(String),
      });
    });

    it("throws when the file is not found", async () => {
      mockedGet.mockRejectedValueOnce(mockApiError);

      await expect(getPreviewUrl("nonexistent")).rejects.toMatchObject({
        status: 404,
        error: "Not Found",
      });
    });
  });

  describe("getDownloadUrl", () => {
    it("calls GET /files/:id/download and returns a UrlResponse", async () => {
      mockedGet.mockResolvedValueOnce({ data: mockUrlResponse });

      const result = await getDownloadUrl("file-123");

      expect(mockedGet).toHaveBeenCalledWith("/files/file-123/download");
      expect(result).toEqual(mockUrlResponse);
    });

    it("returned url response has correct shape", async () => {
      mockedGet.mockResolvedValueOnce({ data: mockUrlResponse });

      const result = await getDownloadUrl("file-123");

      expect(result).toMatchObject<UrlResponse>({
        id: expect.any(String),
        filename: expect.any(String),
        url: expect.any(String),
      });
    });

    it("throws when the file is not found", async () => {
      mockedGet.mockRejectedValueOnce(mockApiError);

      await expect(getDownloadUrl("nonexistent")).rejects.toMatchObject({
        status: 404,
        error: "Not Found",
      });
    });
  });

  describe("deleteFile", () => {
    it("calls DELETE /files/:id", async () => {
      mockedDelete.mockResolvedValueOnce({ data: undefined });

      await deleteFile("file-123");

      expect(mockedDelete).toHaveBeenCalledOnce();
      expect(mockedDelete).toHaveBeenCalledWith("/files/file-123");
    });

    it("returns void on success", async () => {
      mockedDelete.mockResolvedValueOnce({ data: undefined });

      const result = await deleteFile("file-123");

      expect(result).toBeUndefined();
    });

    it("throws when delete is forbidden", async () => {
      const forbiddenError: ApiError = {
        status: 403,
        error: "Forbidden",
        message: "You do not have permission to delete this file",
        timestamp: "2024-01-01T00:00:00Z",
      };
      mockedDelete.mockRejectedValueOnce(forbiddenError);

      await expect(deleteFile("file-123")).rejects.toMatchObject({
        status: 403,
        error: "Forbidden",
      });
    });
  });
});
