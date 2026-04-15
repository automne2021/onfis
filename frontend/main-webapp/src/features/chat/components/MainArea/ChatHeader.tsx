import { Hash, Users, Pin, Search, Phone, MoreVertical, Video } from 'lucide-react';
import { StatusBubble } from '../../../../components/common/StatusBubble';
import { useEffect, useState } from 'react';
import { Button } from '../../../../components/common/Buttons/Button';

interface ChatHeaderProps {
  name: string;
  type: 'group' | 'direct' | 'self';
  memberCount?: number;
  isPinned?: boolean;
  avatarUrl?: string;
  status?: "online" | "busy" | "offline"
}

export function ChatHeader({
  name,
  type,
  memberCount,
  isPinned = false,
  avatarUrl,
  status = 'offline',
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
    <div className="w-full py-2 px-4 flex items-center justify-between bg-white flex-shrink-0 z-10 shadow-sm border-b border-neutral-200">

      {/* --- LEFT SIDE --- */}
      <div className="flex items-center gap-3">
        {type === 'group' ? (
          <div className="w-9 h-9 rounded-lg bg-secondary text-primary flex items-center justify-center flex-shrink-0">
            <Hash size={18} strokeWidth={2.5} />
          </div>
        ) : (
          <div className="relative w-9 h-9 flex-shrink-0">
            <img
              src={avatarUrl}
              alt={name}
              className="w-full h-full object-cover rounded-full"
            />
            <StatusBubble status={status} />
          </div>
        )}

        {/* Cụm Tên và Trạng thái bên dưới */}
        <div className="flex flex-col gap-0 justify-center">
          <h2 className="text-sm font-bold text-neutral-900 leading-tight truncate max-w-[250px]">
            {name}
          </h2>

          <div className="flex items-center gap-2 body-4-regular text-neutral-500">
            {type === 'group' ? (
              <>
                {memberCount && (
                  <button
                    type='button'
                    className="flex items-center gap-1 hover:bg-neutral-200 hover:text-neutral-900 px-2 py-0.5 rounded-md transition-all text-xs"
                  >
                    <Users size={12} />
                    {memberCount} Members
                  </button>
                )}
                <span className="w-1 h-1 rounded-full bg-neutral-500" />
                <button
                  type='button'
                  onClick={handleTogglePin}
                  className={`flex items-center gap-1 transition-colors cursor-pointer text-xs
                      ${localIsPinned ? 'text-primary' : 'hover:text-primary'}
                    `}
                >
                  <Pin size={12} className={localIsPinned ? 'fill-current' : ''} />
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
      <div className="flex items-center gap-2">

        {/* Khung Search */}
        <div className="relative hidden md:block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder={type === 'group' ? "Search in channel" : "Search in chat"}
            className="h-[32px] w-[200px] pl-8 pr-3 bg-neutral-50 rounded-lg text-xs text-neutral-900 border border-neutral-200 focus:border-primary focus:bg-white focus:outline-none transition-all placeholder:text-neutral-400 input-focus"
          />
        </div>

        {/* Nút Call */}
        <Button
          iconLeft={<Phone size={16} />}
          onClick={() => console.log("Start a meeting")}
          style='sub'
          border={false}
          type="button"
          size="square"
          customStyle='p-2'
        />

        <Button
          iconLeft={<Video size={16} />}
          onClick={() => console.log("Video call")}
          style='sub'
          border={false}
          type="button"
          size="square"
          customStyle='p-2'
        />

        <button
          type='button'
          className='p-2 rounded-full text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900 transition element-hover'
        >
          <MoreVertical size={16} />
        </button>

      </div>
    </div>
  );
}