import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "../api/api";
import UploadModal from "./UploadModal";
import { uploadFile } from "../api/files";
import type { FileResponse } from "../types";

vi.mock("../api/files", () => ({
  uploadFile: vi.fn(),
}));

const mockFileResponse: FileResponse = {
  id: "file-123",
  filename: "document.pdf",
  size: 1024,
  contentType: "application/pdf",
  uploadedAt: "2024-01-15T00:00:00Z",
};

const pdfFile = new File(["content"], "document.pdf", {
  type: "application/pdf",
});

describe("UploadModal", () => {
  const onClose = vi.fn();
  const onSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the modal with initial state", () => {
    render(<UploadModal onClose={onClose} onSuccess={onSuccess} />);

    expect(screen.getByText("Upload PDF")).toBeInTheDocument();
    expect(screen.getByText("Click to select a PDF file")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload" })).toBeDisabled();
  });

  it("shows the selected filename after a valid pdf is chosen", async () => {
    const user = userEvent.setup();
    render(<UploadModal onClose={onClose} onSuccess={onSuccess} />);

    const input = document.querySelector(
      "input[type=file]",
    ) as HTMLInputElement;
    await user.upload(input, pdfFile);

    expect(screen.getByText("📄 document.pdf")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload" })).toBeEnabled();
  });

  it("shows an error and disables upload when a non-pdf file is selected", async () => {
    const user = userEvent.setup();
    render(<UploadModal onClose={onClose} onSuccess={onSuccess} />);

    const input = document.querySelector(
      "input[type=file]",
    ) as HTMLInputElement;

    const invalidFile = new File(["content"], "image.png", {
      type: "image/png",
    });
    Object.defineProperty(input, "accept", { value: "", configurable: true });
    await user.upload(input, invalidFile);

    expect(screen.getByText("Only PDF files are allowed.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload" })).toBeDisabled();
  });

  it("calls onSuccess with the uploaded file on successful upload", async () => {
    const user = userEvent.setup();
    vi.mocked(uploadFile).mockResolvedValueOnce(mockFileResponse);
    render(<UploadModal onClose={onClose} onSuccess={onSuccess} />);

    const input = document.querySelector(
      "input[type=file]",
    ) as HTMLInputElement;
    await user.upload(input, pdfFile);
    await user.click(screen.getByRole("button", { name: "Upload" }));

    await waitFor(() => {
      expect(uploadFile).toHaveBeenCalledWith(pdfFile);
      expect(onSuccess).toHaveBeenCalledWith(mockFileResponse);
    });
  });

  it("shows uploading state while the request is in flight", async () => {
    const user = userEvent.setup();
    vi.mocked(uploadFile).mockReturnValue(new Promise(() => {}));
    render(<UploadModal onClose={onClose} onSuccess={onSuccess} />);

    const input = document.querySelector(
      "input[type=file]",
    ) as HTMLInputElement;
    await user.upload(input, pdfFile);
    await user.click(screen.getByRole("button", { name: "Upload" }));

    expect(screen.getByRole("button", { name: "Uploading..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });

  it("shows the server error message on an ApiError with JSON body", async () => {
    const user = userEvent.setup();
    vi.mocked(uploadFile).mockRejectedValueOnce(
      new ApiError(422, JSON.stringify({ message: "File too large." })),
    );
    render(<UploadModal onClose={onClose} onSuccess={onSuccess} />);

    const input = document.querySelector(
      "input[type=file]",
    ) as HTMLInputElement;
    await user.upload(input, pdfFile);
    await user.click(screen.getByRole("button", { name: "Upload" }));

    await waitFor(() => {
      expect(screen.getByText("File too large.")).toBeInTheDocument();
    });
  });

  it("shows a fallback error when ApiError body has no message", async () => {
    const user = userEvent.setup();
    vi.mocked(uploadFile).mockRejectedValueOnce(
      new ApiError(422, JSON.stringify({})),
    );
    render(<UploadModal onClose={onClose} onSuccess={onSuccess} />);

    const input = document.querySelector(
      "input[type=file]",
    ) as HTMLInputElement;
    await user.upload(input, pdfFile);
    await user.click(screen.getByRole("button", { name: "Upload" }));

    await waitFor(() => {
      expect(
        screen.getByText("Upload failed. Please try again."),
      ).toBeInTheDocument();
    });
  });

  it("shows a generic error message on an unexpected error", async () => {
    const user = userEvent.setup();
    vi.mocked(uploadFile).mockRejectedValueOnce(new Error("Unexpected"));
    render(<UploadModal onClose={onClose} onSuccess={onSuccess} />);

    const input = document.querySelector(
      "input[type=file]",
    ) as HTMLInputElement;
    await user.upload(input, pdfFile);
    await user.click(screen.getByRole("button", { name: "Upload" }));

    await waitFor(() => {
      expect(
        screen.getByText("An unexpected error occurred."),
      ).toBeInTheDocument();
    });
  });

  it("calls onClose when Cancel is clicked", async () => {
    const user = userEvent.setup();
    render(<UploadModal onClose={onClose} onSuccess={onSuccess} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when the overlay backdrop is clicked", async () => {
    const user = userEvent.setup();
    render(<UploadModal onClose={onClose} onSuccess={onSuccess} />);

    await user.click(document.querySelector(".modal-overlay")!);

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not call onClose when clicking inside the modal content", async () => {
    const user = userEvent.setup();
    render(<UploadModal onClose={onClose} onSuccess={onSuccess} />);

    await user.click(document.querySelector(".modal-content")!);

    expect(onClose).not.toHaveBeenCalled();
  });
});
