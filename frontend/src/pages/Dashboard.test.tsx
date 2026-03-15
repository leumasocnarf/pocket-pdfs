import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import Dashboard from "./Dashboard";
import { listFiles, deleteFile, getPreviewUrl, uploadFile } from "../api/files";
import { clearToken } from "../stores/token.store";
import type { FileResponse } from "../types";

vi.mock("../api/files", () => ({
  listFiles: vi.fn(),
  deleteFile: vi.fn(),
  uploadFile: vi.fn(),
  getDownloadUrl: vi.fn(),
  getPreviewUrl: vi.fn(),
}));

vi.mock("../stores/token.store", () => ({
  clearToken: vi.fn(),
}));

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockNavigate = vi.fn();

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

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  );
}

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listFiles).mockResolvedValue(mockFiles);
  });

  describe("initial load", () => {
    it("shows a loading state while fetching files", () => {
      vi.mocked(listFiles).mockReturnValue(new Promise(() => {}));

      renderDashboard();

      expect(screen.getByText("Loading your files...")).toBeInTheDocument();
    });

    it("renders the list of files after loading", async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText("document.pdf")).toBeInTheDocument();
        expect(screen.getByText("report.pdf")).toBeInTheDocument();
      });
    });

    it("shows an error message when fetching files fails", async () => {
      vi.mocked(listFiles).mockRejectedValueOnce(new Error("Network error"));

      renderDashboard();

      await waitFor(() => {
        expect(
          screen.getByText("Failed to load files. Please try again."),
        ).toBeInTheDocument();
      });
    });

    it("shows the empty state when there are no files", async () => {
      vi.mocked(listFiles).mockResolvedValueOnce([]);

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText("No PDFs uploaded yet.")).toBeInTheDocument();
      });
    });
  });

  describe("header actions", () => {
    it("renders the Upload PDF and Logout buttons", async () => {
      renderDashboard();

      await waitFor(() =>
        expect(screen.getByText("document.pdf")).toBeInTheDocument(),
      );

      expect(
        screen.getByRole("button", { name: "+ Upload PDF" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Logout" }),
      ).toBeInTheDocument();
    });

    it("clears the token and navigates to /login on logout", async () => {
      const user = userEvent.setup();
      renderDashboard();

      await waitFor(() =>
        expect(screen.getByText("document.pdf")).toBeInTheDocument(),
      );

      await user.click(screen.getByRole("button", { name: "Logout" }));

      expect(clearToken).toHaveBeenCalledOnce();
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  describe("upload modal", () => {
    it("opens the upload modal when Upload PDF is clicked", async () => {
      const user = userEvent.setup();
      renderDashboard();

      await waitFor(() =>
        expect(screen.getByText("document.pdf")).toBeInTheDocument(),
      );

      await user.click(screen.getByRole("button", { name: "+ Upload PDF" }));

      expect(screen.getByText("Upload PDF")).toBeInTheDocument();
    });

    it("closes the upload modal when Cancel is clicked", async () => {
      const user = userEvent.setup();
      renderDashboard();

      await waitFor(() =>
        expect(screen.getByText("document.pdf")).toBeInTheDocument(),
      );

      await user.click(screen.getByRole("button", { name: "+ Upload PDF" }));
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(screen.queryByText("Upload PDF")).not.toBeInTheDocument();
    });

    it("adds the new file to the list and closes the modal on successful upload", async () => {
      const user = userEvent.setup();
      const newFile: FileResponse = {
        id: "file-3",
        filename: "new-file.pdf",
        size: 512,
        contentType: "application/pdf",
        uploadedAt: "2024-03-01T00:00:00Z",
      };

      vi.mocked(listFiles).mockResolvedValueOnce([mockFiles[0]]);
      renderDashboard();

      await waitFor(() =>
        expect(screen.getByText("document.pdf")).toBeInTheDocument(),
      );

      await user.click(screen.getByRole("button", { name: "+ Upload PDF" }));

      // Simulate a successful upload by directly calling onSuccess via the modal
      // We grab the h2 to confirm the modal is open, then find the hidden input
      expect(
        screen.getByRole("heading", { name: "Upload PDF" }),
      ).toBeInTheDocument();

      const input = document.querySelector(
        "input[type=file]",
      ) as HTMLInputElement;
      Object.defineProperty(input, "accept", { value: "", configurable: true });

      vi.mocked(uploadFile).mockResolvedValueOnce(newFile);
      await user.upload(
        input,
        new File(["content"], "new-file.pdf", { type: "application/pdf" }),
      );
      await user.click(screen.getByRole("button", { name: "Upload" }));

      await waitFor(() => {
        expect(screen.getByText("new-file.pdf")).toBeInTheDocument();
        expect(
          screen.queryByRole("heading", { name: "Upload PDF" }),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("delete", () => {
    it("removes the file from the list after confirming deletion", async () => {
      const user = userEvent.setup();
      vi.mocked(deleteFile).mockResolvedValueOnce(undefined);
      vi.spyOn(window, "confirm").mockReturnValueOnce(true);

      renderDashboard();

      await waitFor(() =>
        expect(screen.getByText("document.pdf")).toBeInTheDocument(),
      );

      await user.click(screen.getAllByRole("button", { name: "Delete" })[0]);

      await waitFor(() => {
        expect(deleteFile).toHaveBeenCalledWith("file-1");
        expect(screen.queryByText("document.pdf")).not.toBeInTheDocument();
        expect(screen.getByText("report.pdf")).toBeInTheDocument();
      });
    });

    it("does not delete the file when the confirmation is cancelled", async () => {
      const user = userEvent.setup();
      vi.spyOn(window, "confirm").mockReturnValueOnce(false);

      renderDashboard();

      await waitFor(() =>
        expect(screen.getByText("document.pdf")).toBeInTheDocument(),
      );

      await user.click(screen.getAllByRole("button", { name: "Delete" })[0]);

      expect(deleteFile).not.toHaveBeenCalled();
      expect(screen.getByText("document.pdf")).toBeInTheDocument();
    });

    it("shows an error message when deletion fails", async () => {
      const user = userEvent.setup();
      vi.mocked(deleteFile).mockRejectedValueOnce(new Error("Network error"));
      vi.spyOn(window, "confirm").mockReturnValueOnce(true);

      renderDashboard();

      await waitFor(() =>
        expect(screen.getByText("document.pdf")).toBeInTheDocument(),
      );

      await user.click(screen.getAllByRole("button", { name: "Delete" })[0]);

      await waitFor(() => {
        expect(screen.getByText("Failed to delete file.")).toBeInTheDocument();
      });
    });
  });

  describe("preview modal", () => {
    it("opens the preview modal when Preview is clicked", async () => {
      const user = userEvent.setup();
      vi.mocked(getPreviewUrl).mockResolvedValueOnce({
        id: "file-1",
        filename: "document.pdf",
        url: "https://storage.example.com/preview-url",
      });

      renderDashboard();

      await waitFor(() =>
        expect(screen.getByText("document.pdf")).toBeInTheDocument(),
      );

      await user.click(screen.getAllByRole("button", { name: "Preview" })[0]);

      expect(
        screen.getByRole("heading", { name: "document.pdf" }),
      ).toBeInTheDocument();
    });

    it("closes the preview modal when the close button is clicked", async () => {
      const user = userEvent.setup();
      vi.mocked(getPreviewUrl).mockResolvedValueOnce({
        id: "file-1",
        filename: "document.pdf",
        url: "https://storage.example.com/preview-url",
      });

      renderDashboard();

      await waitFor(() =>
        expect(screen.getByText("document.pdf")).toBeInTheDocument(),
      );

      await user.click(screen.getAllByRole("button", { name: "Preview" })[0]);
      await user.click(screen.getByRole("button", { name: "✕" }));

      await waitFor(() => {
        expect(
          screen.queryByRole("heading", { name: "document.pdf" }),
        ).not.toBeInTheDocument();
      });
    });
  });
});
