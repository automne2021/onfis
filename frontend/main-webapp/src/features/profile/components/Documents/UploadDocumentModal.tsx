import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Icon from "../../../../components/common/Icon";

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadDocumentModal({ isOpen, onClose }: UploadDocumentModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    console.log("Uploading file:", selectedFile.name);
    // TODO: Implement actual upload logic
    onClose();
    setSelectedFile(null);
  };

  const handleClose = () => {
    onClose();
    setSelectedFile(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-[fadeIn_200ms_ease-out]" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-[480px] animate-[slideUp_250ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="text-base font-bold text-neutral-900">Upload New Document</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors text-neutral-500"
          >
            <Icon name="close" size={20} color="#62748E" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
              ${dragActive
                ? "border-primary bg-primary/5 scale-[1.02]"
                : "border-neutral-300 hover:border-primary/50 hover:bg-neutral-50"
              }
            `}
          >
            <div className="flex flex-col items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                dragActive ? "bg-primary/10" : "bg-neutral-100"
              }`}>
                <Icon name="cloud_upload" size={24} color={dragActive ? "#0014A8" : "#90A1B9"} />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-700">
                  {dragActive ? "Drop your file here" : "Click or drag file to upload"}
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  PDF, DOC, DOCX, XLS, XLSX, PNG, JPG up to 10MB
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              onChange={handleFileChange}
            />
          </div>

          {/* Selected File Preview */}
          {selectedFile && (
            <div className="mt-4 flex items-center gap-3 bg-neutral-50 rounded-lg border border-neutral-200 px-4 py-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon name="description" size={20} color="#0014A8" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-800 truncate">{selectedFile.name}</p>
                <p className="text-xs text-neutral-400">{formatFileSize(selectedFile.size)}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                }}
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-neutral-200 transition-colors"
              >
                <Icon name="close" size={16} color="#90A1B9" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-neutral-600 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Upload
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
