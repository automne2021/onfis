import React from 'react';
import { StatusBubble } from '../StatusBubble';

interface ChatItemProps {
  name: string;
  isActive: boolean;
  onClick: () => void;
  // Dùng cho Group
  icon?: React.ReactNode; 
  // Dùng cho Direct Message
  avatarUrl?: string;
  status?: "online" | "busy" | "offline"; // ĐÃ ĐỔI THÀNH STATUS
}

export function ChatItem({ name, isActive, onClick, icon, avatarUrl, status }: ChatItemProps) {
  return (
    <div 
      onClick={onClick}
      className={`
        flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors body-3-regular
        ${isActive ? 'bg-secondary text-primary' : 'text-neutral-500 hover:bg-neutral-50'}
      `}
    >
      {avatarUrl ? (
        <div className="relative w-6 h-6 rounded-full flex-shrink-0">
          <img src={avatarUrl} alt={name} className="w-full h-full object-cover rounded-full" />
          {status && (
            <StatusBubble status={status} size='small'/>
          )}

        </div>
      ) : (
        <div className={`flex items-center justify-center flex-shrink-0 ${isActive ? 'text-primary' : 'text-neutral-500'}`}>
          {icon}
        </div>
      )}

      {/* Tên phòng / Tên người */}
      <span className={`truncate select-none ${isActive ? 'font-medium' : ''}`}>
        {name}
      </span>
    </div>
  );
}