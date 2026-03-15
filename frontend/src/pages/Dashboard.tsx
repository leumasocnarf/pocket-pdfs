import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { clearToken } from "../stores/token.store.ts";
import { type FileResponse } from "../types.ts";
import { deleteFile, listFiles } from "../api/files.ts";
import FileList from "../components/FileList.tsx";
import PreviewModal from "../components/PreviewModal.tsx";
import UploadModal from "../components/UploadModal.tsx";
import "../styles/dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [showUpload, setShowUpload] = useState<boolean>(false);
  const [previewFile, setPreviewFile] = useState<FileResponse | null>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  async function fetchFiles() {
    try {
      setLoading(true);
      const data = await listFiles();
      setFiles(data);
    } catch {
      setError("Failed to load files. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this file?")) return;
    try {
      await deleteFile(id);
      setFiles((prev) => prev.filter((f) => f.id !== id));
    } catch {
      setError("Failed to delete file.");
    }
  }

  function handleUploadSuccess(newFile: FileResponse) {
    setFiles((prev) => [newFile, ...prev]);
    setShowUpload(false);
  }

  function handleLogout() {
    clearToken();
    navigate("/login");
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>PDF Vault</h1>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowUpload(true)}
          >
            + Upload PDF
          </button>
          <button className="btn btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        {error && <p className="error-message">{error}</p>}

        {loading ? (
          <p className="loading-text">Loading your files...</p>
        ) : (
          <FileList
            files={files}
            onDelete={handleDelete}
            onPreview={(file) => setPreviewFile(file)}
          />
        )}
      </main>

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {previewFile && (
        <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );
}
