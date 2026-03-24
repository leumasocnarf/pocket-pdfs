import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PreviewModal from "./PreviewModal";
import { getPreviewUrl } from "../api/files";
import type { FileResponse } from "../types";

vi.mock("../api/files", () => ({
  getPreviewUrl: vi.fn(),
}));

const mockFile: FileResponse = {
  id: "file-123",
  filename: "document.pdf",
  size: 1024,
  contentType: "application/pdf",
  uploadedAt: "2024-01-15T00:00:00Z",
};

const mockUrl = "https://storage.example.com/preview-url";

describe("PreviewModal", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a loading state while fetching the preview url", () => {
    vi.mocked(getPreviewUrl).mockReturnValue(new Promise(() => {}));
    render(<PreviewModal file={mockFile} onClose={onClose} />);

    expect(screen.getByText("Loading preview...")).toBeInTheDocument();
    expect(screen.queryByRole("iframe")).not.toBeInTheDocument();
  });

  it("renders the filename in the header", async () => {
    vi.mocked(getPreviewUrl).mockResolvedValueOnce({
      id: "file-123",
      filename: "document.pdf",
      url: mockUrl,
    });

    render(<PreviewModal file={mockFile} onClose={onClose} />);

    await waitFor(() =>
      expect(screen.queryByText("Loading preview...")).not.toBeInTheDocument(),
    );

    expect(screen.getByText("document.pdf")).toBeInTheDocument();
  });

  it("renders the iframe with the preview url on success", async () => {
    vi.mocked(getPreviewUrl).mockResolvedValueOnce({
      id: "file-123",
      filename: "document.pdf",
      url: mockUrl,
    });

    const { container } = render(
      <PreviewModal file={mockFile} onClose={onClose} />,
    );

    await waitFor(() => {
      const iframe = container.querySelector("iframe");
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute("src", mockUrl);
    });
  });

  it("shows an error message when the preview url fetch fails", async () => {
    vi.mocked(getPreviewUrl).mockRejectedValueOnce(new Error("Network error"));

    render(<PreviewModal file={mockFile} onClose={onClose} />);

    await waitFor(() => {
      expect(
        screen.getByText("Could not load preview. Try downloading instead."),
      ).toBeInTheDocument();
    });
    expect(screen.queryByRole("iframe")).not.toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", async () => {
    const user = userEvent.setup();
    vi.mocked(getPreviewUrl).mockResolvedValueOnce({
      id: "file-123",
      filename: "document.pdf",
      url: mockUrl,
    });

    render(<PreviewModal file={mockFile} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "✕" }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when the overlay backdrop is clicked", async () => {
    const user = userEvent.setup();
    vi.mocked(getPreviewUrl).mockResolvedValueOnce({
      id: "file-123",
      filename: "document.pdf",
      url: mockUrl,
    });

    render(<PreviewModal file={mockFile} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "✕" }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not call onClose when clicking inside the modal content", async () => {
    const user = userEvent.setup();
    vi.mocked(getPreviewUrl).mockResolvedValueOnce({
      id: "file-123",
      filename: "document.pdf",
      url: mockUrl,
    });

    const { container } = render(
      <PreviewModal file={mockFile} onClose={onClose} />,
    );

    await waitFor(() =>
      expect(container.querySelector("iframe")).toBeInTheDocument(),
    );
    await user.click(container.querySelector(".modal-content")!);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("refetches the preview url when the file id changes", async () => {
    vi.mocked(getPreviewUrl).mockResolvedValue({
      id: "file-123",
      filename: "document.pdf",
      url: mockUrl,
    });

    const { rerender } = render(
      <PreviewModal file={mockFile} onClose={onClose} />,
    );

    await waitFor(() => expect(getPreviewUrl).toHaveBeenCalledWith("file-123"));

    const newFile: FileResponse = { ...mockFile, id: "file-456" };
    rerender(<PreviewModal file={newFile} onClose={onClose} />);

    await waitFor(() => expect(getPreviewUrl).toHaveBeenCalledWith("file-456"));
    expect(getPreviewUrl).toHaveBeenCalledTimes(2);
  });
});
