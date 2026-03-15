import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FileList from "./FileList";
import type { FileResponse } from "../types";

vi.mock("../api/files", () => ({
  getDownloadUrl: vi.fn(),
}));

const mockFiles: FileResponse[] = [
  {
    id: "file-1",
    filename: "document.pdf",
    size: 1024,
    contentType: "application/pdf",
    uploadedAt: "2024-01-15T00:00:00Z",
  },
  {
    id: "file-2",
    filename: "report.pdf",
    size: 2048,
    contentType: "application/pdf",
    uploadedAt: "2024-02-20T00:00:00Z",
  },
];

describe("FileList", () => {
  const onDelete = vi.fn();
  const onPreview = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders an empty state when there are no files", () => {
    render(<FileList files={[]} onDelete={onDelete} onPreview={onPreview} />);

    expect(screen.getByText("No PDFs uploaded yet.")).toBeInTheDocument();
    expect(screen.getByText(/Upload PDF/)).toBeInTheDocument();
  });

  it("renders a card for each file", () => {
    render(
      <FileList files={mockFiles} onDelete={onDelete} onPreview={onPreview} />,
    );

    expect(screen.getByText("document.pdf")).toBeInTheDocument();
    expect(screen.getByText("report.pdf")).toBeInTheDocument();
  });

  it("calls onDelete with the correct id when Delete is clicked", async () => {
    const user = userEvent.setup();
    render(
      <FileList files={mockFiles} onDelete={onDelete} onPreview={onPreview} />,
    );

    await user.click(screen.getAllByRole("button", { name: "Delete" })[0]);

    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith("file-1");
  });

  it("calls onPreview with the correct file when Preview is clicked", async () => {
    const user = userEvent.setup();
    render(
      <FileList files={mockFiles} onDelete={onDelete} onPreview={onPreview} />,
    );

    await user.click(screen.getAllByRole("button", { name: "Preview" })[0]);

    expect(onPreview).toHaveBeenCalledOnce();
    expect(onPreview).toHaveBeenCalledWith(mockFiles[0]);
  });
});
