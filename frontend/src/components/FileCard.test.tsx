import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FileCard from "./FileCard";
import { getDownloadUrl } from "../api/files";
import type { FileResponse } from "../types";

vi.mock("../api/files", () => ({
  getDownloadUrl: vi.fn(),
}));

const mockFile: FileResponse = {
  id: "file-123",
  filename: "document.pdf",
  size: 1024 * 1024, // 1 MB
  contentType: "application/pdf",
  uploadedAt: "2024-01-15T00:00:00Z",
};

describe("FileCard", () => {
  const onDelete = vi.fn();
  const onPreview = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders filename, formatted size and formatted date", () => {
    render(
      <FileCard file={mockFile} onDelete={onDelete} onPreview={onPreview} />,
    );

    const expectedDate = new Date(mockFile.uploadedAt).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      },
    );

    expect(screen.getByText("document.pdf")).toBeInTheDocument();
    expect(screen.getByText(/1\.0 MB/)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(expectedDate))).toBeInTheDocument();
  });

  it("calls onPreview with the file when Preview is clicked", async () => {
    const user = userEvent.setup();
    render(
      <FileCard file={mockFile} onDelete={onDelete} onPreview={onPreview} />,
    );

    await user.click(screen.getByRole("button", { name: "Preview" }));

    expect(onPreview).toHaveBeenCalledOnce();
    expect(onPreview).toHaveBeenCalledWith(mockFile);
  });

  it("calls onDelete with the file id when Delete is clicked", async () => {
    const user = userEvent.setup();
    render(
      <FileCard file={mockFile} onDelete={onDelete} onPreview={onPreview} />,
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith("file-123");
  });

  it("opens the download url in a new tab when Download is clicked", async () => {
    const user = userEvent.setup();
    vi.mocked(getDownloadUrl).mockResolvedValueOnce({
      id: "file-123",
      filename: "document.pdf",
      url: "https://storage.example.com/signed-url",
    });
    const windowOpen = vi.spyOn(window, "open").mockImplementation(() => null);

    render(
      <FileCard file={mockFile} onDelete={onDelete} onPreview={onPreview} />,
    );

    await user.click(screen.getByRole("button", { name: "Download" }));

    await waitFor(() => {
      expect(getDownloadUrl).toHaveBeenCalledWith("file-123");
      expect(windowOpen).toHaveBeenCalledWith(
        "https://storage.example.com/signed-url",
        "_blank",
      );
    });
  });

  it("does not open a new tab when the download url request fails", async () => {
    const user = userEvent.setup();
    vi.mocked(getDownloadUrl).mockRejectedValueOnce(new Error("Network error"));
    const windowOpen = vi.spyOn(window, "open").mockImplementation(() => null);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(
      <FileCard file={mockFile} onDelete={onDelete} onPreview={onPreview} />,
    );

    await user.click(screen.getByRole("button", { name: "Download" }));

    await waitFor(() => {
      expect(windowOpen).not.toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });

  it("renders files smaller than 1KB with bytes unit", () => {
    render(
      <FileCard
        file={{ ...mockFile, size: 512 }}
        onDelete={onDelete}
        onPreview={onPreview}
      />,
    );

    expect(screen.getByText(/512 B/)).toBeInTheDocument();
  });

  it("renders files smaller than 1MB with KB unit", () => {
    render(
      <FileCard
        file={{ ...mockFile, size: 2048 }}
        onDelete={onDelete}
        onPreview={onPreview}
      />,
    );

    expect(screen.getByText(/2\.0 KB/)).toBeInTheDocument();
  });
});
