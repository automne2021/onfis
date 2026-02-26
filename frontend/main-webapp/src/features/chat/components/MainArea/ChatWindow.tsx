import { ChatHeader } from "./ChatHeader";
import { MOCK_CHANNELS, MOCK_USERS, MOCK_MESSAGES } from "../../../../data/mockChatData"; // Đường dẫn tuỳ project của bạn
import { ChatInput } from "./ChatInput/ChatInput";
import { MessageArea } from "./MessageList/MessageArea";

interface ChatWindowProps {
  activeChannelId: string;
}

export function ChatWindow({ activeChannelId }: ChatWindowProps) {
  const currentChannel = MOCK_CHANNELS.find(c => c.id === activeChannelId);
  
  let avatarUrl = undefined;
  let userStatus: "online" | "busy" | "offline" = "offline";
  
  if (currentChannel?.type === 'direct') {
    const userKey = currentChannel.id.replace('dm-', '');
    const targetUser = MOCK_USERS[userKey];
    if (targetUser) {
      avatarUrl = targetUser.avatarUrl;
      userStatus = targetUser.status; // Lấy trực tiếp status từ mock data mới
    }
  }

  const currentMessages = MOCK_MESSAGES.filter(m => m.channelId === activeChannelId);

  return(
    <div className="flex flex-col h-full w-full bg-white relative">
      
      {/* HEADER */}
      {currentChannel ? (
        <ChatHeader 
          name={currentChannel.name}
          type={currentChannel.type}
          memberCount={currentChannel.membersCount}
          isPinned={currentChannel.isPinned}
          avatarUrl={avatarUrl}
          status={userStatus} // Đã sửa thành status={userStatus}
        />
      ) : (
        <div className="h-[76px] border-b border-neutral-200 flex items-center px-6 text-neutral-500">
          Start a chat now!
        </div>
      )}

      {/* === TẦNG 2: MESSAGE AREA (BODY) === */}
      <MessageArea channel={currentChannel} messages={currentMessages} />

      {/* === CHAT INPUT === */}
      <ChatInput label={currentChannel?.name || "conversation"} />

    </div>
  )
}