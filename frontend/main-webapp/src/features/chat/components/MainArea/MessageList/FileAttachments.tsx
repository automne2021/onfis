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

  return (
    <div className="mt-2 w-[320px] p-3 rounded-xl flex items-center gap-4 bg-white shadow-md hover:shadow-lg transition cursor-pointer group">
      
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
      <button className="text-neutral-500 group-hover:text-primary p-2">
        <Download size={18} />
      </button>
      
    </div>
  );
}