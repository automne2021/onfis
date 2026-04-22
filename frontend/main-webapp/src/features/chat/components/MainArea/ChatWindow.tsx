import { useState, useEffect } from "react";
import { ChatHeader } from "./ChatHeader";
import { ChatInput } from "./ChatInput/ChatInput";
import { MessageArea } from "./MessageList/MessageArea";
import type { ChatChannel } from "../../types/chatTypes";
import { useChat } from "../../hooks/useChat";
import { useAuth } from "../../../../hooks/useAuth";
import { userApi } from "../../services/userApi";
import { usePresence } from "../../context/PresenceContext";
import { chatApi } from "../../services/chatApi";

interface DBUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  email: string;
}

interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    first_name?: string;
    firstName?: string;
    last_name?: string;
    lastName?: string;
    full_name?: string;
    name?: string;
    avatar_url?: string;
  };
}

// 1. SỬA: Thêm onRefreshChannels vào Props để component cha truyền vào
interface ChatWindowProps {
  activeChannelId: string;
  currentChannel: ChatChannel | null;
  onRefreshChannels?: (silent?: boolean) => void; 
}

export function ChatWindow({ activeChannelId, currentChannel, onRefreshChannels }: ChatWindowProps) {
  const { user, isLoading: isAuthLoading } = useAuth();
  
  const [dbUser, setDbUser] = useState<DBUser | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  useEffect(() => {
    if (isAuthLoading) return; 

    if (!user?.id) {
      const timer = setTimeout(() => setIsProfileLoading(false), 0);
      return () => clearTimeout(timer);
    }

    userApi.getProfile(user.id)
      .then((data: DBUser) => setDbUser(data))
      .catch(err => console.error("Error fetching profile", err))
      .finally(() => setIsProfileLoading(false));
  }, [user?.id, isAuthLoading]);

  // Hàm xử lý Pin nằm ở Component cha
  const handleTogglePin = async () => {
    if (!activeChannelId) return;
    try {
      await chatApi.togglePinConversation(activeChannelId);
      if (onRefreshChannels) onRefreshChannels(true); 
    } catch (error) {
      console.error("Lỗi khi ghim:", error);
    }
  };

  if (isProfileLoading || isAuthLoading) {
    return <ChatWindowSkeleton />;
  }

  return (
    <ChatWindowContent
      activeChannelId={activeChannelId}
      currentChannel={currentChannel}
      user={user as AuthUser} 
      dbUser={dbUser}
      onTogglePin={handleTogglePin} // 2. SỬA: Truyền hàm này xuống component con
    />
  );
}

// 3. SỬA: Thêm onTogglePin vào Interface của Component con
interface ChatWindowContentProps {
  activeChannelId: string;
  currentChannel: ChatChannel | null;
  user: AuthUser | null;
  dbUser: DBUser | null;
  onTogglePin: () => Promise<void>; 
}

function ChatWindowContent({ activeChannelId, currentChannel, user, dbUser, onTogglePin }: ChatWindowContentProps) {
  const { statuses } = usePresence();
  
  const firstName = dbUser?.firstName || "";
  const lastName = dbUser?.lastName || "";
  let fullName = `${firstName} ${lastName}`.trim();

  if (!fullName) {
    fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User";
  }

  const currentUserAvatarUrl = dbUser?.avatarUrl || user?.user_metadata?.avatar_url || ""; 

  const currentUserInfo = user ? {
    id: user.id,
    name: fullName,
    avatarUrl: currentUserAvatarUrl
  } : undefined;

  // Lấy status realtime
  const headerStatus = currentChannel?.targetUserId && statuses[currentChannel.targetUserId] 
      ? statuses[currentChannel.targetUserId] 
      : currentChannel?.status;
  
  const { messages, isConnected, sendMessage } = useChat(activeChannelId, currentUserInfo);
  
  const cleanHeaderName = (currentChannel?.name || "Unknown User").replace(/\(You\)/g, '').trim();
  const headerAvatarUrl = currentChannel?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanHeaderName)}&background=random`;

  return (
    <div className="flex flex-col h-full w-full bg-white relative">
      {currentChannel ? (
        <ChatHeader
          name={cleanHeaderName}
          type={currentChannel.type}
          memberCount={currentChannel.membersCount}
          isPinned={currentChannel.isPinned} 
          onTogglePin={onTogglePin} 
          avatarUrl={headerAvatarUrl}
          status={headerStatus} 
          conversationId={currentChannel.id}
        />
      ) : (
         <div className="h-[48px] px-4 flex items-center border-b border-neutral-200">Start a chat now!</div>
      )}

      <MessageArea channel={currentChannel} messages={messages} />

      <ChatInput 
        label={cleanHeaderName} 
        onSendMessage={sendMessage}
        disabled={!isConnected}
      />
    </div>
  );
}

function ChatWindowSkeleton() {
  return (
    <div className="flex flex-col h-full w-full bg-white relative animate-pulse">
      {/* Header Skeleton */}
      <div className="w-full h-[60px] flex items-center px-4 border-b border-neutral-200 gap-3 flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-neutral-200" />
        <div className="flex flex-col gap-2">
          <div className="w-32 h-4 bg-neutral-200 rounded" />
          <div className="w-20 h-3 bg-neutral-200 rounded" />
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-6 justify-end pb-8">
        <div className="flex items-end gap-3 w-full">
          <div className="w-10 h-10 rounded-full bg-neutral-200 flex-shrink-0" />
          <div className="w-1/3 h-12 bg-neutral-200 rounded-2xl rounded-bl-none" />
        </div>
        <div className="flex items-end gap-3 w-full flex-row-reverse">
          <div className="w-10 h-10 rounded-full bg-neutral-200 flex-shrink-0" />
          <div className="w-1/4 h-12 bg-neutral-200 rounded-2xl rounded-br-none" />
        </div>
         <div className="flex items-end gap-3 w-full flex-row-reverse">
          <div className="w-10 h-10 rounded-full bg-neutral-200 flex-shrink-0" />
          <div className="w-2/5 h-16 bg-neutral-200 rounded-2xl rounded-br-none" />
        </div>
      </div>

      <div className="p-4 border-t border-neutral-200 flex-shrink-0">
         <div className="w-full h-12 bg-neutral-100 rounded-xl" />
      </div>
    </div>
  );
}