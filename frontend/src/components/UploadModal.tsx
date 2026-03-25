import { useState, useRef, type ChangeEvent } from "react";
import axios from "axios";
import { uploadFile } from "../api/files.ts";
import type { FileResponse } from "../types.ts";
import "../styles/modal.css";
import { captureApiError } from "../utils/sentry.ts";

interface Props {
  onClose: () => void;
  onSuccess: (file: FileResponse) => void;
}

export default function UploadModal({ onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      setFile(null);
      return;
    }
    setError("");
    setFile(selected);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError("");

    try {
      const uploaded = await uploadFile(file);
      onSuccess(uploaded);
    } catch (err: unknown) {
      captureApiError(err, { filename: file.name, fileSize: file.size });
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message ?? "Upload failed. Please try again."
          : "An unexpected error occurred."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Upload PDF</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div
            className="upload-area"
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            {file ? (
              <p className="upload-filename">📄 {file.name}</p>
            ) : (
              <p className="upload-placeholder">Click to select a PDF file</p>
            )}
          </div>

          {error && <p className="error-message">{error}</p>}
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
