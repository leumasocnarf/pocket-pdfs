import type { FileResponse } from "../types.ts";
import FileCard from "./FileCard.tsx";
import "../styles/filelist.css";

interface Props {
  files: FileResponse[];
  onDelete: (id: string) => void;
  onPreview: (file: FileResponse) => void;
}

export default function FileList({ files, onDelete, onPreview }: Props) {
  if (files.length === 0) {
    return (
      <div className="empty-state">
        <p>No PDFs uploaded yet.</p>
        <p>
          Click <strong>+ Upload PDF</strong> to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="file-list">
      {files.map((file) => (
        <FileCard
          key={file.id}
          file={file}
          onDelete={onDelete}
          onPreview={onPreview}
        />
      ))}
    </div>
  );
}
