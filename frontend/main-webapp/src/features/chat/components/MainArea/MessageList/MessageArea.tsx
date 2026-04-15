import type { ChatChannel, ChatMessage } from '../../../types/chatTypes';
import { useAuth } from '../../../../../hooks/useAuth';
import { DateSeparator } from './DateSeparator';
import { MessageBubble } from './MessageBubble';

interface MessageAreaProps {
  channel?: ChatChannel | null; // Cập nhật cho phép null
  messages: ChatMessage[];
}

export function MessageArea({ channel, messages }: MessageAreaProps) {
  
  // 3. Lấy thông tin user đang đăng nhập từ Supabase
  const { user } = useAuth(); 

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 bg-neutral-50 custom-scrollbar">
      <div className="flex flex-col justify-end min-h-full gap-3">

        {/* Lời chào đầu tiên */}
        <p className="text-center text-neutral-400 text-sm py-4 mt-auto">
          {channel?.type === 'group'
            ? `This is the start of the conversation in #${channel?.name}`
            : `This is the beginning of your direct message history with ${channel?.name}`
          }
        </p>

        {/* Vòng lặp Render Tin nhắn */}
        {messages.map((msg) => {
          const isOwn = msg.sender.id === user?.id;

          return (
            <div key={msg.id} className="flex flex-col w-full">
              {msg.dateSeparator && (
                <DateSeparator date={msg.dateSeparator} />
              )}
              <MessageBubble msg={msg} isOwn={isOwn} />
            </div>
          );
        })}

      </div>
    </div>
  );
}