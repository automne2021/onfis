import type { ChatMessage } from '../../../types/chatTypes'; // Chỉnh lại đường dẫn cho đúng với project của bạn
import { StatusBubble } from '../../StatusBubble';
import { FileAttachment } from './FileAttachments';
import { MeetingCard } from './MeetingCard';

interface MessageBubbleProps {
  msg: ChatMessage;
  isOwn: boolean;
}

export function MessageBubble({ msg, isOwn }: MessageBubbleProps) {

  if (msg.type === 'meeting' && msg.meeting) {
    return (
      <MeetingCard msg={msg} />
    );
  }

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

      {/* Nội dung tin nhắn */}
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

        {/* Văn bản (Có bong bóng nếu là mình, không bong bóng nếu là người khác) */}
        {msg.content && (
          <div className={`
            body-3-regular text-neutral-900 px-3 py-2 shadow-md 
            ${isOwn ? 'bg-secondary rounded-s-lg rounded-br-lg' : 'bg-white rounded-e-lg rounded-bl-lg'}
          `}>
            {msg.content}
          </div>
        )}

        {/* Thẻ File Đính kèm (Nếu có) */}
        {msg.type === 'file' && msg.file && (
          <FileAttachment msg={msg} />
        )}

      </div>
    </div>
  );
}