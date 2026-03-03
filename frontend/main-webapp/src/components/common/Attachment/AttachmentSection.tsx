import { 
  CloudUpload
} from '@mui/icons-material';
import { useRef, useState } from 'react';
import { FileTag } from './FileTag';


interface AttachmentSectionProps {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

const getFileType = (fileName: string) => {
  return fileName.split('.').pop()?.toLowerCase() || '';
};

// --- COMPONENT: ATTACHMENT SECTION ---
export function AttachmentSection({ files, setFiles }: AttachmentSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles((prev) => [...prev, ...droppedFiles]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className='flex flex-col gap-4'>
      <div 
        className={`
          flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all cursor-pointer
          ${isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-neutral-200 bg-neutral-50 hover:bg-primary/5 hover:border-primary'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="p-3 bg-white rounded-full shadow-sm mb-3">
          <CloudUpload className="text-neutral-500" fontSize="medium" />
        </div>
        
        <p className="text-sm font-medium text-neutral-900">
          Click or drag files to upload
        </p>
        <p className="text-xs text-neutral-500 mt-1">
          PDF, DOCX, XLSX, JPG, PNG up to 10MB
        </p>

        <input
          type="file"
          multiple
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileSelect}
          accept=".pdf,.docx,.xlsx,.xls,.jpg,.jpeg,.png"
        />
      </div>

      {/* --- FILE LIST --- */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, index) => {
            const fileExtension = getFileType(file.name)
            return(
              <FileTag 
                key={`${file.name}-${index}`} 
                name={file.name}
                size={file.size}
                type={fileExtension}
                onRemove={() => handleRemoveFile(index)}
              />
          )})}
        </div>
      )}
    </div>
  );
}
