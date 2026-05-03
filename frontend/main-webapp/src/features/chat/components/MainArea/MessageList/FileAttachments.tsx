import { FileText, Download } from 'lucide-react';
import type { ChatMessage } from '../../../types/chatTypes'; 
import { FILE_ICONS, FILE_COLORS, getFileType } from '../../../../../config/fileConfig';

interface FileAttachmentProps {
  msg: ChatMessage;
}

export function FileAttachment({ msg }: FileAttachmentProps) {
  if (!msg.file) return null;

  const ext = getFileType(msg.file.name);
  const color = FILE_COLORS[ext] || FILE_COLORS.default;
  const iconSrc = FILE_ICONS[ext];

  const handleCardClick = () => {
    window.open(msg.file!.url, '_blank', 'noopener,noreferrer');
  };

  const handleForceDownload = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    e.preventDefault();

    try {
      const response = await fetch(msg.file!.url);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = msg.file!.name || 'download';
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Lỗi khi ép tải file:", error);
      window.open(msg.file!.url, '_blank');
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className="mt-2 w-[320px] p-3 rounded-xl flex items-center gap-4 bg-white shadow-md hover:shadow-lg transition cursor-pointer group"
    >
      
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color.bg} ${color.text}`}>
        {iconSrc ? (
          <img src={iconSrc} alt={`${ext} icon`} className="w-6 h-6 object-contain" />
        ) : (
          <FileText size={20} />
        )}
      </div>

      {/* --- File details --- */}
      <div className="flex-1 min-w-0 flex flex-col">
        <span className="body-3-medium text-neutral-900 truncate">{msg.file.name}</span>
        <span className="text-[12px] text-neutral-500">{msg.file.size}</span>
      </div>

      {/* --- Download button --- */}
      <button 
        onClick={handleForceDownload}
        title="Download file"
        className="text-neutral-500 hover:text-primary hover:bg-primary/10 rounded-full p-2 transition-colors z-10"
      >
        <Download size={18} />
      </button>
      
    </div>
  );
}