import { X, FileText } from 'lucide-react';
import { FILE_ICONS, FILE_COLORS, getFileType } from '../../../../../config/fileConfig';

interface AttachedFilesPreviewProps {
  attachedFiles: File[]
  onRemove: (index: number) => void
}

export function AttachedFilesPreview({ attachedFiles, onRemove } : AttachedFilesPreviewProps) {

  if (attachedFiles.length === 0) return null;

  return(
    <div className="mb-3 flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar animate-in fade-in slide-in-from-bottom-2 duration-200">
      {attachedFiles.map((file, index) => {
  
        const ext = getFileType(file.name);
        const color = FILE_COLORS[ext] || FILE_COLORS.default;
        const iconSrc = FILE_ICONS[ext];

        return (
        <div 
          key={`${file.name}-${index}`} 
          className="flex items-center gap-4 p-2.5 pr-3 rounded-xl bg-white w-fit max-w-[240px] shadow-md flex-shrink-0 relative group"
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color.bg} ${color.text}`}>
            {iconSrc ? (
              <img src={iconSrc} alt={`${ext} icon`} className="w-6 h-6 object-contain" />
            ) : (
              <FileText size={20} />
            )}
          </div>
          
          <div className="flex-1 min-w-0 flex flex-col pr-6">
            <span className="body-3-medium text-neutral-900 truncate">{file.name}</span>
            <span className="text-[12px] text-neutral-500 truncate">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </span>
          </div>

          <button
            type="button"
            onClick={() => onRemove(index)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-5 00 hover:text-neutral-900 hover:bg-neutral-200 rounded-full transition-all opacity-0 group-hover:opacity-100"
          >
            <X size={16} />
          </button>
        </div>
      )})}
    </div>
  )
}