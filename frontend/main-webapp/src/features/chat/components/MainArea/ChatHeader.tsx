import { Hash, Users, Pin, Search, Phone, MoreVertical, Video } from 'lucide-react';
import { StatusBubble } from '../StatusBubble';
import { useEffect, useState } from 'react';
import { Button } from '../../../../components/common/Buttons/Button';

interface ChatHeaderProps {
  name: string;
  type: 'group' | 'direct';
  memberCount?: number;
  isPinned?: boolean;
  avatarUrl?: string;
  status?: "online" | "busy" | "offline"
}

export function ChatHeader({
  name,
  type,
  memberCount,
  isPinned=false,
  avatarUrl,
  status='offline',
}: ChatHeaderProps) {

  const [localIsPinned, setLocalIsPinned] = useState(isPinned);

  useEffect(() => {
    requestAnimationFrame(() => {
      setLocalIsPinned(isPinned);
    });
  }, [isPinned, name])

  const handleTogglePin = () => {
    setLocalIsPinned(prev => !prev);
  };

  return (
    <div className="w-full py-4 px-6 flex items-center justify-between bg-white flex-shrink-0 z-10 shadow-sm">
      
      {/* --- LEFT SIDE --- */}
      <div className="flex items-center gap-4">
        {type === 'group' ? (
          <div className="w-11 h-11 rounded-xl bg-secondary text-primary flex items-center justify-center flex-shrink-0">
            <Hash size={24} strokeWidth={2.5} />
          </div>
        ) : (
          <div className="relative w-11 h-11 flex-shrink-0">
            <img 
              src={avatarUrl} 
              alt={name} 
              className="w-full h-full object-cover rounded-full" 
            />
            <StatusBubble status={status} />
          </div>
        )}

        {/* Cụm Tên và Trạng thái bên dưới */}
        <div className="flex flex-col gap-0.5 justify-center">
          <h2 className="header-h6 text-neutral-900 leading-tight truncate max-w-[300px]">
            {name}
          </h2>
          
          <div className="flex items-center gap-2 mt-0.5 body-3-regular text-neutral-500">
            {type === 'group' ? (
              <>
                {memberCount && (
                  <button 
                    type='button'
                    className="flex items-center gap-1.5 hover:bg-neutral-200 hover:text-neutral-900 px-3 py-1 rounded-md transition-all"
                  >
                    <Users size={14} />
                    {memberCount} Members
                  </button>
                )}
                  <span className="w-1 h-1 rounded-full bg-neutral-500 mx-1"/>
                  <button 
                    type='button'
                    onClick={handleTogglePin} 
                    className={`flex items-center gap-1.5 transition-colors cursor-pointer
                      ${localIsPinned ? 'text-primary' : 'hover:text-primary'}
                    `}
                  >
                    <Pin size={14} className={localIsPinned ? 'fill-current' : ''} /> 
                    {localIsPinned ? 'Pinned' : 'Pin Channel'}
                  </button>
              </>
            ) : (
              <span className="body-4-regular text-neutral-500 capitalize">
                {status}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* --- RIGHT SIDE --- */}
      <div className="flex items-center gap-3">
        
        {/* Khung Search */}
        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input 
            type="text" 
            placeholder={type === 'group' ? "Search in channel" : "Search in conversation"}
            className="h-[42px] w-[260px] pl-10 pr-4 bg-neutral-50 rounded-lg text-sm text-neutral-900 border border-transparent focus:border-neutral-200 focus:bg-white focus:outline-none transition-all placeholder:text-neutral-400"
          />
        </div>

        {/* Nút Call */}
        <Button
          iconLeft={<Phone size={18} />}
          onClick={() => console.log("Start a meeting")}
          style='sub'
          border={false}
          type="button"
          size="square"
          customStyle='p-3'
        />

        <Button
          iconLeft={<Video size={18} />}
          onClick={() => console.log("Video call")}
          style='sub'
          border={false}
          type="button"
          size="square"
          customStyle='p-3'
        />

        <button
          type='button'
          className='p-3 rounded-full text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900 transition'
        >
          <MoreVertical size={18} />
        </button>

      </div>
    </div>
  );
}