import { useRef } from "react";

export interface AttachmentFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  size?: number;
  uploading?: boolean;
  uploadedByName?: string;
  createdAt?: string;
}

interface FileAttachmentSectionProps {
  title?: string;
  attachments: AttachmentFile[];
  onUpload: (files: File[]) => void;
  onDelete?: (id: string) => void;
  canUpload: boolean;
  canDelete: boolean;
  accept?: string;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(fileType?: string): string {
  if (!fileType) return "description";
  if (fileType.startsWith("image/")) return "image";
  if (fileType === "application/pdf") return "picture_as_pdf";
  if (fileType.includes("spreadsheet") || fileType.includes("excel")) return "table_chart";
  if (fileType.includes("word") || fileType.includes("document")) return "article";
  if (fileType.startsWith("video/")) return "movie";
  if (fileType.startsWith("audio/")) return "audio_file";
  if (fileType.includes("zip") || fileType.includes("rar") || fileType.includes("compressed")) return "folder_zip";
  return "description";
}

export default function FileAttachmentSection({
  title = "Attachments",
  attachments,
  onUpload,
  onDelete,
  canUpload,
  canDelete,
  accept,
}: FileAttachmentSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      onUpload(files);
    }
    // Reset so same file can be re-selected
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-500">{title}</span>
        {canUpload && (
          <>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={accept}
              className="hidden"
              onChange={handleInputChange}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
            >
              <span className="material-symbols-rounded" style={{ fontSize: 14 }}>upload</span>
              Upload
            </button>
          </>
        )}
      </div>

      {attachments.length === 0 ? (
        <p className="text-xs text-neutral-400 italic">No files attached.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {attachments.map((file) => (
            <li
              key={file.id}
              className="flex items-center gap-3 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl"
            >
              {/* Icon */}
              <span className="material-symbols-rounded text-neutral-400 shrink-0" style={{ fontSize: 20 }}>
                {fileIcon(file.fileType)}
              </span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <a
                  href={file.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:underline truncate block max-w-full"
                  title={file.fileName}
                >
                  {file.uploading ? (
                    <span className="flex items-center gap-2 text-neutral-400">
                      <span className="material-symbols-rounded animate-spin" style={{ fontSize: 14 }}>progress_activity</span>
                      Uploading…
                    </span>
                  ) : (
                    file.fileName
                  )}
                </a>
                <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                  {file.size != null && <span>{formatFileSize(file.size)}</span>}
                  {file.uploadedByName && <span>· {file.uploadedByName}</span>}
                  {file.createdAt && <span>· {file.createdAt}</span>}
                </div>
              </div>

              {/* Delete */}
              {canDelete && !file.uploading && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(file.id)}
                  className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                  title="Remove file"
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 16 }}>delete</span>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
