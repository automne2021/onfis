import { MoreVert } from '@mui/icons-material';
import { FILE_ICONS, FILE_COLORS, getFileType } from '../../../../config/fileConfig'; 
import type { UserDocument } from '../../../../types/userType'; 
import { ConfidentialTag } from '../Tags/ConfidentialTag';

interface DocumentCardProps {
  document: UserDocument;
}

export function DocumentCard({ document }: DocumentCardProps) {
  const fileExt = getFileType(document.fileName);
  const fileIcon = FILE_ICONS[fileExt] || FILE_ICONS.pdf; 
  const fileColor = FILE_COLORS[fileExt] || FILE_COLORS.default;

  const targetUrl = document.fileUrl ? document.fileUrl : `/documents/view/${document.id}`;

  const handleMoreClick = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    
    console.log("Open file menu:", document.fileName);
  };

  return (
    <a 
      href={targetUrl}
      target="_blank" 
      rel="noopener noreferrer" 
      className="block cursor-pointer bg-white rounded-xl border border-neutral-200 p-5 flex-col justify-between min-w-[360px] h-full transition-all duration-200 group hover:scale-105 hover:border-primary"
    >
      
      <div className="flex flex-col gap-5 pb-3 border-b border-neutral-200">
        {/* Header */}
        <div className="flex justify-between items-start">
          {/* File icon */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${fileColor.bg} transition-transform duration-200 group-hover:scale-105`}>
            <img src={fileIcon} alt={`${fileExt} icon`} className="w-6 h-6 object-contain" />
          </div>
          {/* More button */}
          <button 
            onClick={handleMoreClick} 
            className="text-neutral-500 transition-colors px-1.5 py-1 rounded-full hover:bg-neutral-50 text-center"
          >
            <MoreVert fontSize="small" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-1.5">
          <p 
            className="body-2-medium text-neutral-900 truncate transition-colors duration-200 group-hover:text-primary" 
            title={document.fileName}
          >
            {document.fileName}
          </p>
          <p className="body-3-regular text-neutral-500">
            {document.fileSize} <span className="mx-1.5">•</span> {document.uploadDate}
          </p>
        </div>
      </div>

      <div className="mt-4 min-h-[28px] flex items-end">
        {document.isConfidential && (
          <ConfidentialTag />
        )}
      </div>

    </a>
  );
}