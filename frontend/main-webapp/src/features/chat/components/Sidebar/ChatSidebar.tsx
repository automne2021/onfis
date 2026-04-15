import { Button } from "../../../../components/common/Buttons/Button";
import type { ChatChannel } from "../../types/chatTypes";
import { ChatGroup } from "./ChatGroup";
import { ChatItem } from "./ChatItem";
import { CurrentUserFooter } from "./CurrentUserFooter";

interface ChatSidebarProps {
  channels: ChatChannel[];
  activeChannelId: string;
  onChannelSelect: (id: string) => void;
  icons?: Record<string, React.ReactNode>
}

export function ChatSidebar({ channels, activeChannelId, onChannelSelect, icons }: ChatSidebarProps) {

  const projectGroups = channels.filter(channel => channel.type === 'group');
  const directMessages = channels.filter(channel => channel.type === 'direct');
  const selfChats = channels.filter(channel => channel.type === 'self');

  return (
    <div className="flex flex-col h-full w-full justify-between bg-white">
      <div className="flex flex-col gap-4 overflow-y-auto min-h-0 flex-1">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 ">
          <p className="header-h6 leading-none text-neutral-900">Messages</p>
          <Button
            id="edit-chat"
            iconLeft={icons && icons['edit']}
            onClick={() => console.log('Edit chat')}
            style='primary'
            type="button"
            border={false}
            size="square"
          />
        </div>

        {/* Channel */}
        <div className="flex flex-col gap-2">

          <ChatGroup title="Project Groups">
            {projectGroups.map((channel) => (
              <ChatItem
                key={channel.id}
                name={channel.name}
                isActive={activeChannelId === channel.id}
                onClick={() => onChannelSelect(channel.id)}
                icon={icons && icons['hash']}
              />
            ))}
          </ChatGroup>

          <ChatGroup title="Direct Messages">
            {directMessages.map((channel) => (
              <ChatItem
                key={channel.id}
                name={channel.name} 
                avatarUrl={channel.avatarUrl} 
                status={channel.status} 
                isActive={activeChannelId === channel.id}
                onClick={() => onChannelSelect(channel.id)}
              />
            ))}
          </ChatGroup>
          
          <ChatGroup title="Saved Messages">
            {selfChats.map((channel) => (
              <ChatItem
                key={channel.id}
                name={channel.name} 
                avatarUrl={channel.avatarUrl} 
                status={channel.status || "online"} 
                isActive={activeChannelId === channel.id}
                onClick={() => onChannelSelect(channel.id)}
              />
            ))}
          </ChatGroup>

        </div>
      </div>

      {/* Current User Footer */}
      <CurrentUserFooter />
    </div>
  )
}