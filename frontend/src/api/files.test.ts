import { describe, it, expect, vi, beforeEach } from "vitest";
import api from "./api.ts";
import {
  listFiles,
  uploadFile,
  getPreviewUrl,
  getDownloadUrl,
  deleteFile,
} from "./files.ts";
import type { FileResponse, UrlResponse } from "../types.ts";
import { ApiError } from "./api.ts";

vi.mock("./api.ts", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    status: number;
    body: string;
    constructor(status: number, body: string) {
      super(`Request failed: ${status}`);
      this.status = status;
      this.body = body;
    }
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

describe("files api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listFiles", () => {
    it("calls GET /files and returns data", async () => {
      mockedGet.mockResolvedValueOnce([mockFile]);

      const result = await listFiles();

      expect(mockedGet).toHaveBeenCalledOnce();
      expect(mockedGet).toHaveBeenCalledWith("/files");
      expect(result).toEqual([mockFile]);
    });

    it("returns an empty array when there are no files", async () => {
      mockedGet.mockResolvedValueOnce([]);

      const result = await listFiles();

      expect(result).toEqual([]);
    });

    it("throws when the request fails", async () => {
      mockedGet.mockRejectedValueOnce(
        new ApiError(404, JSON.stringify({ error: "Not Found" })),
      );

      await expect(listFiles()).rejects.toBeInstanceOf(ApiError);
    });
  });

  describe("uploadFile", () => {
    it("calls POST /files/upload with FormData", async () => {
      mockedPost.mockResolvedValueOnce(mockFile);
      const file = new File(["content"], "document.pdf", {
        type: "application/pdf",
      });

      const result = await uploadFile(file);

      expect(mockedPost).toHaveBeenCalledOnce();
      const [url, body] = mockedPost.mock.calls[0];
      expect(url).toBe("/files/upload");
      expect(body).toBeInstanceOf(FormData);
      expect(body.get("file")).toBe(file);
      expect(result).toEqual(mockFile);
    });

    it("returns a FileResponse with correct shape on success", async () => {
      mockedPost.mockResolvedValueOnce(mockFile);
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
      mockedPost.mockRejectedValueOnce(
        new ApiError(413, JSON.stringify({ error: "File too large" })),
      );
      const file = new File(["content"], "document.pdf", {
        type: "application/pdf",
      });

      await expect(uploadFile(file)).rejects.toBeInstanceOf(ApiError);
    });
  });

  describe("getPreviewUrl", () => {
    it("calls GET /files/:id/preview and returns a UrlResponse", async () => {
      mockedGet.mockResolvedValueOnce(mockUrlResponse);

      const result = await getPreviewUrl("file-123");

      expect(mockedGet).toHaveBeenCalledWith("/files/file-123/preview");
      expect(result).toEqual(mockUrlResponse);
    });

    it("returned url response has correct shape", async () => {
      mockedGet.mockResolvedValueOnce(mockUrlResponse);

      const result = await getPreviewUrl("file-123");

      expect(result).toMatchObject<UrlResponse>({
        id: expect.any(String),
        filename: expect.any(String),
        url: expect.any(String),
      });
    });

    it("throws when the file is not found", async () => {
      mockedGet.mockRejectedValueOnce(
        new ApiError(404, JSON.stringify({ error: "Not Found" })),
      );

      await expect(getPreviewUrl("nonexistent")).rejects.toBeInstanceOf(
        ApiError,
      );
    });
  });

  describe("getDownloadUrl", () => {
    it("calls GET /files/:id/download and returns a UrlResponse", async () => {
      mockedGet.mockResolvedValueOnce(mockUrlResponse);

      const result = await getDownloadUrl("file-123");

      expect(mockedGet).toHaveBeenCalledWith("/files/file-123/download");
      expect(result).toEqual(mockUrlResponse);
    });

    it("returned url response has correct shape", async () => {
      mockedGet.mockResolvedValueOnce(mockUrlResponse);

      const result = await getDownloadUrl("file-123");

      expect(result).toMatchObject<UrlResponse>({
        id: expect.any(String),
        filename: expect.any(String),
        url: expect.any(String),
      });
    });

    it("throws when the file is not found", async () => {
      mockedGet.mockRejectedValueOnce(
        new ApiError(404, JSON.stringify({ error: "Not Found" })),
      );

      await expect(getDownloadUrl("nonexistent")).rejects.toBeInstanceOf(
        ApiError,
      );
    });
  });

  describe("deleteFile", () => {
    it("calls DELETE /files/:id", async () => {
      mockedDelete.mockResolvedValueOnce(undefined);

      await deleteFile("file-123");

      expect(mockedDelete).toHaveBeenCalledOnce();
      expect(mockedDelete).toHaveBeenCalledWith("/files/file-123");
    });

    it("returns void on success", async () => {
      mockedDelete.mockResolvedValueOnce(undefined);

      const result = await deleteFile("file-123");

      expect(result).toBeUndefined();
    });

    it("throws when delete is forbidden", async () => {
      mockedDelete.mockRejectedValueOnce(
        new ApiError(403, JSON.stringify({ error: "Forbidden" })),
      );

      const error = await deleteFile("file-123").catch((e) => e);

      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(403);
    });
  });
});
