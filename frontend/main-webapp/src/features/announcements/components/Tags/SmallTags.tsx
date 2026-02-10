import { FILE_ICONS, FILE_COLORS } from "../../../../config/fileConfig"; 

interface SmallTagsProps {
  type: string; // 'pdf', 'docx', 'jpg'
  fileName?: string; // Optional: để làm alt text hoặc tooltip
}

export function SmallTags({ type, fileName } : SmallTagsProps) {
  // Lấy đường dẫn icon và theme màu
  const iconSrc = FILE_ICONS[type] || FILE_ICONS.default;
  const theme = FILE_COLORS[type] || FILE_COLORS.default;

  return (
    <div 
      className={`
        flex items-center justify-center 
        w-10 h-10 rounded-lg 
        ${theme.bg} ${theme.text} 
        cursor-pointer transition-transform hover:scale-105
      `}
      title={fileName} // Hiển thị tên file khi hover
    >
      <img 
        src={iconSrc} 
        alt={type} 
        className="w-6 h-6 object-contain" 
      />
    </div>
  );
}