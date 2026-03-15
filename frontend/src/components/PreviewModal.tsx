import { useState, useEffect } from "react";
import type { FileResponse } from "../types.ts";
import { getPreviewUrl } from "../api/files.ts";
import "../styles/modal.css";

interface Props {
  file: FileResponse;
  onClose: () => void;
}

export default function PreviewModal({ file, onClose }: Props) {
  const [url, setUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function fetchUrl() {
      try {
        const data = await getPreviewUrl(file.id);
        setUrl(data.url);
      } catch {
        setError("Could not load preview. Try downloading instead.");
      } finally {
        setLoading(false);
      }
    }
    fetchUrl();
  }, [file.id]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content modal-large"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 title={file.filename}>{file.filename}</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body modal-preview-body">
          {loading && <p className="loading-text">Loading preview...</p>}
          {error && <p className="error-message">{error}</p>}
          {url && (
            <iframe
              src={url}
              title={file.filename}
              className="pdf-preview-frame"
            />
          )}
        </div>
      </div>
    </div>
  );
}
