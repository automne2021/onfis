import { useState } from 'react';
import { KeyboardArrowDown } from '@mui/icons-material';

interface ChatGroupProps {
  title: string;
  children: React.ReactNode;
}

export function ChatGroup({ title, children }: ChatGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="mb-4">
      {/* Tiêu đề nhóm */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 py-2 px-4 mb-2 body-3-medium text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-50 transition-colors group select-none"
      >
        {/* Icon xoay mượt mà thay vì đổi icon giật cục */}
        <KeyboardArrowDown 
          fontSize="small" 
          className={`transition-transform duration-300 ease-in-out ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
        />
        <span className="group-hover:text-neutral-700 transition-colors">{title}</span>
      </div>

      {/* Wrapper Animation dùng CSS Grid */}
      <div 
        className={`
          grid transition-[grid-template-rows] duration-300 ease-in-out
          ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}
        `}
      >
        {/* Bắt buộc phải có overflow-hidden ở đây để nội dung không bị tràn khi collapse */}
        <div className="overflow-hidden">
          {/* Nội dung chính nằm ở đây */}
          <div className="flex flex-col gap-0.5 px-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}