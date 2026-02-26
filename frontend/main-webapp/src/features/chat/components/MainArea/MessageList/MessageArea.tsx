import type { ChatChannel, ChatMessage } from '../../../types/chatTypes';
import { CURRENT_USER } from '../../../../../data/mockChatData';
import { DateSeparator } from './DateSeparator'; 
import { MessageBubble } from './MessageBubble'; 

interface MessageAreaProps {
  channel?: ChatChannel;
  messages: ChatMessage[];
}

export function MessageArea({ channel, messages }: MessageAreaProps) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 bg-neutral-50 custom-scrollbar">
      <div className="flex flex-col justify-end min-h-full gap-6">

        {/* Lời chào đầu tiên */}
        <p className="text-center text-neutral-400 text-sm py-4 mt-auto">
          {channel?.type === 'group' 
            ? `This is the start of the conversation in #${channel?.name}`
            : `This is the beginning of your direct message history with ${channel?.name}`
          }
        </p>

        {/* Vòng lặp Render Tin nhắn */}
        {messages.map((msg) => {
          const isOwn = msg.sender.id === CURRENT_USER.id;

          return (
            <div key={msg.id} className="flex flex-col w-full">
              
              {/* Dải phân cách ngày (Nếu có) */}
              {msg.dateSeparator && (
                <DateSeparator date={msg.dateSeparator} />
              )}

              {/* Bong bóng tin nhắn */}
              <MessageBubble msg={msg} isOwn={isOwn} />
              
            </div>
          );
        })}

      </div>
    </div>
  );
}