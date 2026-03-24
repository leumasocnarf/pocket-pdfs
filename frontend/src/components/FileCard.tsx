import type { FileResponse } from "../types.ts";
import "../styles/filecard.css";
import { getDownloadUrl } from "../api/files.ts";

interface Props {
  file: FileResponse;
  onDelete: (id: string) => void;
  onPreview: (file: FileResponse) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function FileCard({ file, onDelete, onPreview }: Props) {
  async function handleDownload() {
    try {
      const data = await getDownloadUrl(file.id);
      window.open(data.url, "_blank");
    } catch {
      console.error("Failed to get download URL");
    }
  }

  return (
    <div className="file-card">
      <div className="file-card-icon">📄</div>

      <div className="file-card-info">
        <p className="file-card-name" title={file.filename}>
          {file.filename}
        </p>
        <p className="file-card-meta">
          {formatSize(file.size)} · {formatDate(file.uploadedAt)}
        </p>
      </div>

      <div className="file-card-actions">
        <button
          className="btn btn-small btn-secondary"
          onClick={() => onPreview(file)}
        >
          Preview
        </button>
        <button
          className="btn btn-small btn-secondary"
          onClick={handleDownload}
        >
          Download
        </button>
        <button
          className="btn btn-small btn-danger"
          onClick={() => onDelete(file.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
