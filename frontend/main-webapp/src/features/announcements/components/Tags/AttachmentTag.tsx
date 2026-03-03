import { FILE_ICONS, FILE_COLORS } from "../../../../config/fileConfig"; 
import { FileDownloadOutlined } from '@mui/icons-material';

interface AttachmentTagsProps {
  type: string; // 'pdf', 'docx', 'jpg'
  fileName?: string; // Optional: để làm alt text hoặc tooltip
}

export function AttachmentTags({ type, fileName } : AttachmentTagsProps) {
  // Lấy đường dẫn icon và theme màu
  const iconSrc = FILE_ICONS[type] || FILE_ICONS.default;
  const theme = FILE_COLORS[type] || FILE_COLORS.default;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-neutral-300 bg-white cursor-pointer transition hover:border-primary hover:scale-105">
      <div 
        className={`flex items-center justify-center w-10 h-10 rounded-lg 
          ${theme.bg} ${theme.text} 
        `}
        title={fileName} // Hiển thị tên file khi hover
      >
        <img 
          src={iconSrc} 
          alt={type} 
          className="w-6 h-6 object-contain" 
        />
      </div>
      {fileName}
      <button
        type="button"
        className="p-2 rounded-full text-neutral-500 transition hover:bg-neutral-200"
      >
        <FileDownloadOutlined />
      </button>
    </div>
  );
}