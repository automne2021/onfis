import type { ChatMessage } from '../../../types/chatTypes';
import { StatusBubble } from '../../../../../components/common/StatusBubble';
import { FileAttachment } from './FileAttachments';
import { MeetingCard } from './MeetingCard';

interface MessageBubbleProps {
  msg: ChatMessage;
  isOwn: boolean;
  onJoinCall: (token: string, room: string, meetingId: string, isHost: boolean, isVideo: boolean, avatarUrl?: string, name?: string) => void;
}

export function MessageBubble({ msg, isOwn, onJoinCall }: MessageBubbleProps) {

  // Tin nhắn hệ thống (Nằm giữa màn hình)
  if (msg.type === 'system') {
    return (
      <div className="w-full flex justify-center my-4">
        <span className="body-4-regular text-neutral-500 px-4 py-1.5 rounded-full">
          {msg.content}
        </span>
      </div>
    );
  }

  // ĐÃ XÓA ĐOẠN RETURN SỚM CỦA MEETING Ở ĐÂY

  return (
    <div className={`flex gap-2.5 w-full ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>

      {/* Avatar */}
      <div className='relative w-10 h-10 rounded-full flex-shrink-0'>
        <img
          src={msg.sender.avatarUrl}
          alt={msg.sender.name}
          className="w-full h-full object-cover rounded-full"
        />
        <StatusBubble status={msg.sender.status} />
      </div>

      {/* Nội dung tin nhắn (Bong bóng) */}
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>

        {/* Tên & Thời gian */}
        <div className={`flex items-baseline gap-2 mb-1.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="body-3-medium text-neutral-900">
            {isOwn ? 'You' : msg.sender.name}
          </span>
          <span className="body-4-regular text-neutral-400">
            {msg.timestamp}
          </span>
        </div>

        {/* 1. NẾU LÀ TIN NHẮN CHỮ (Văn bản thường) */}
        {msg.type !== 'meeting' && msg.content && (
          <div className={`
            body-3-regular text-neutral-900 px-3 py-2 shadow-md 
            ${isOwn ? 'bg-secondary rounded-s-lg rounded-br-lg' : 'bg-white rounded-e-lg rounded-bl-lg'}
          `}>
            {msg.content}
          </div>
        )}

        {/* 2. NẾU LÀ CUỘC GỌI (Meeting) -> Render Card ngay trong khung này */}
        {msg.type === 'meeting' && (
          <div className={`rounded-2xl shadow-sm border border-neutral-100 overflow-hidden ${isOwn ? 'bg-secondary/5' : 'bg-white'}`}>
             <MeetingCard msg={msg} onJoin={(token, room) => onJoinCall(
                 token, room, msg.meeting!.id, isOwn, msg.meeting!.type === 'VIDEO', msg.sender.avatarUrl, msg.sender.name
               )} />
          </div>
        )}

        {/* 3. NẾU LÀ FILE ĐÍNH KÈM */}
        {msg.type === 'file' && msg.file && (
          <FileAttachment msg={msg} />
        )}

      </div>
    </div>
  );
}