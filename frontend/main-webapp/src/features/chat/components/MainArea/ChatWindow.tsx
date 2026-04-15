import { ChatHeader } from "./ChatHeader";
// import { MOCK_CHANNELS, MOCK_USERS, MOCK_MESSAGES } from "../../../../data/mockChatData"; // Đường dẫn tuỳ project của bạn
import { ChatInput } from "./ChatInput/ChatInput";
import { MessageArea } from "./MessageList/MessageArea";
import type { ChatChannel } from "../../types/chatTypes";
import { useChat } from "../../hooks/useChat";

interface ChatWindowProps {
  activeChannelId: string;
  currentChannel: ChatChannel | null;
}

export function ChatWindow({ activeChannelId, currentChannel }: ChatWindowProps) {
  
  // Gọi hook quản lý logic tin nhắn
  const { messages, isConnected, sendMessage } = useChat(activeChannelId);
  console.log("isConnected: ", isConnected);

  return (
    <div className="flex flex-col h-full w-full bg-white relative">
      {currentChannel ? (
        <ChatHeader
          name={currentChannel.name}
          type={currentChannel.type}
          memberCount={currentChannel.membersCount}
          isPinned={currentChannel.isPinned}
          avatarUrl={currentChannel.avatarUrl} 
          status={currentChannel.status} 
        />
      ) : (
         <div className="h-[48px]">Start a chat now!</div>
      )}

      {/* Truyền messages thật vào */}
      <MessageArea channel={currentChannel} messages={messages} />

      <ChatInput 
        label={currentChannel?.name || "conversation"} 
        onSendMessage={sendMessage}
        disabled={!isConnected}
      />
    </div>
  )
}