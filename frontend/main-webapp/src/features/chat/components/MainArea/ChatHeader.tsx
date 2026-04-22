import { Hash, Users, Pin, Search, Phone, MoreVertical, Video, Lock, UserPlus, Settings } from 'lucide-react';
import { StatusBubble } from '../../../../components/common/StatusBubble';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../../../../components/common/Buttons/Button';
import { InviteMemberModal } from '../Modal/InviteMemberModal';
import { GroupSettingsModal } from '../Modal/GroupSettingsModal';
import { ViewMembersModal } from '../Modal/ViewMembersModal';
import { chatApi } from '../../services/chatApi';
import { useCall } from '../../context/CallContext';

interface ChatHeaderProps {
  name: string;
  type: 'public_group' | 'private_group' | 'direct' | 'self';
  memberCount?: number;
  isPinned?: boolean;
  avatarUrl?: string;
  status?: "online" | "busy" | "offline";
  conversationId: string;
}

export function ChatHeader({
  name,
  type,
  memberCount = 0,
  isPinned = false,
  avatarUrl,
  status = 'offline',
  conversationId
}: ChatHeaderProps) {

  const { startLiveKit } = useCall();

  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isMembersOpen, setIsMembersOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [localMemberCount, setLocalMemberCount] = useState(memberCount);

  const [localIsPinned, setLocalIsPinned] = useState(isPinned);

  const isGroupChat = type === 'public_group' || type === 'private_group';
  const isPrivateGroup = type === 'private_group';

  useEffect(() => {
    requestAnimationFrame(() => {
      setLocalMemberCount(memberCount);
      setLocalIsPinned(isPinned);
    });
  }, [memberCount, isPinned, name]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => {
      setLocalIsPinned(isPinned);
    });
  }, [isPinned, name])

  const handleTogglePin = () => {
    setLocalIsPinned(prev => !prev);
  };

  const startCall = async (callType: 'VIDEO' | 'AUDIO') => {
    try {
      // 1. Backend tạo phòng
      const response = await chatApi.createMeeting(conversationId, callType);
      // 2. Tự động Join lấy Token luôn
      const joinData = await chatApi.joinMeeting(response.meeting.id);
      // 3. Mở Full màn hình Video
      startLiveKit(joinData.token, joinData.roomName, response.meeting.id, true, callType === 'VIDEO', avatarUrl, name);
    } catch (error) {
      console.error("Lỗi khi khởi tạo cuộc gọi:", error);
    }
  };

  return (
    <div className="w-full py-2 px-4 flex items-center justify-between bg-white flex-shrink-0 z-10 shadow-sm border-b border-neutral-200">

      {/* --- LEFT SIDE --- */}
      <div className="flex items-center gap-3">
        {isGroupChat ? (
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-primary flex items-center justify-center flex-shrink-0">
            {isPrivateGroup ? <Lock size={20} strokeWidth={2.5} /> : <Hash size={20} strokeWidth={2.5} />}
          </div>
        ) : (
          <div className="relative w-10 h-10 flex-shrink-0">
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover rounded-full" />
            <StatusBubble status={status} />
          </div>
        )}

        <div className="flex flex-col gap-0 justify-center">
          <h2 className="text-[15px] font-semibold text-neutral-900 leading-tight truncate max-w-[250px]">
            {name}
          </h2>

          <div className="flex items-center gap-2 mt-0.5 body-4-regular text-neutral-500">
            {isGroupChat ? (
              <>
                <div className="flex items-center gap-1.5 transition-all text-[13px]">
                  <Users size={14} />
                  <span>{localMemberCount} Members</span>
                </div>
                <span className="w-1 h-1 rounded-full bg-neutral-400" />
                <button
                  type='button'
                  onClick={handleTogglePin}
                  className={`flex items-center gap-1 transition-colors cursor-pointer text-[13px]
                      ${localIsPinned ? 'text-primary' : 'hover:text-primary'}
                    `}
                >
                  <Pin size={14} className={localIsPinned ? 'fill-current' : ''} />
                  {localIsPinned ? 'Pinned' : 'Pin Channel'}
                </button>
              </>
            ) : (
              <span className="text-[13px] capitalize">{status}</span>
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
            placeholder={(type === 'public_group' || type === "private_group") ? "Search in channel" : "Search in chat"}
            className="h-[32px] w-[200px] pl-8 pr-3 bg-neutral-50 rounded-lg text-xs text-neutral-900 border border-neutral-200 focus:border-primary focus:bg-white focus:outline-none transition-all placeholder:text-neutral-400 input-focus"
          />
        </div>

        {/* Nút Call */}
        <Button
          iconLeft={<Phone size={16} />}
          onClick={() => startCall('AUDIO')} 
          style='sub'
          border={false}
          type="button"
          size="square"
          customStyle='p-2'
        />

        {/* Nút Gọi Video */}
        <Button
          iconLeft={<Video size={16} />}
          onClick={() => startCall('VIDEO')} 
          style='sub'
          border={false}
          type="button"
          size="square"
          customStyle='p-2'
        />

        <div className="relative" ref={menuRef}>
          <button
            type='button'
            onClick={() => setShowMenu(!showMenu)}
            className={`p-2 rounded-full transition ${showMenu ? 'bg-neutral-200 text-neutral-900' : 'text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900'}`}
          >
            <MoreVertical size={16} />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-10 w-48 bg-white border border-neutral-200 shadow-lg rounded-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              <button onClick={() => setIsMembersOpen(true)} className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-neutral-50">
                <Users size={14} /> View Members
              </button>
              
              <button onClick={() => setIsSettingsOpen(true)} className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-neutral-50">
                <Settings size={14} /> Settings
              </button>
              {type === 'private_group' && (
                <button 
                  onClick={() => {
                    setShowMenu(false);
                    setIsInviteModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                >
                  <UserPlus size={14} /> Invite Member
                </button>
              )}
            </div>
          )}
        </div>

      </div>

      {conversationId && (
        <InviteMemberModal 
          isOpen={isInviteModalOpen} 
          onClose={() => setIsInviteModalOpen(false)} 
          conversationId={conversationId} 
          channelName={name} 
        />
      )}

      <ViewMembersModal isOpen={isMembersOpen} onClose={() => setIsMembersOpen(false)} conversationId={conversationId} />
      <GroupSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} channel={{id: conversationId, type: type}} onUpdate={() => window.location.reload()} />
    </div>
  );
}