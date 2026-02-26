import { Button } from "../../../../components/common/Buttons/Button";
import { CURRENT_USER, MOCK_CHANNELS, MOCK_USERS } from "../../../../data/mockChatData";
import { ChatGroup } from "./ChatGroup";
import { ChatItem } from "./ChatItem";
import { CurrentUserFooter } from "./CurrentUserFooter";

interface ChatSidebarProps {
  activeChannelId: string;
  onChannelSelect: (id: string) => void;
  icons?: Record<string, React.ReactNode>
}

export function ChatSidebar({ activeChannelId, onChannelSelect, icons }: ChatSidebarProps) {

  const currentUser = CURRENT_USER
  const projectGroups = MOCK_CHANNELS.filter(channel => channel.type === 'group');
  const directMessages = MOCK_CHANNELS.filter(channel => channel.type === 'direct');
  const userData = MOCK_USERS

  return(
    <div className="flex flex-col h-full w-full justify-between bg-white">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-6 border-b border-neutral-200 ">
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
          {/* Project Groups */}
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
            
          {/* Direct Messages */}
          <ChatGroup title="Direct Messages">
            {directMessages.map((channel) => {
              const userKey = channel.id.replace('dm-', ''); 
              const user = userData[userKey];

              return (
                <ChatItem 
                  key={channel.id}
                  name={channel.name}
                  isActive={activeChannelId === channel.id}
                  onClick={() => onChannelSelect(channel.id)}
                  avatarUrl={user?.avatarUrl} 
                  status={user?.status}
                />
              );
            })}
          </ChatGroup>
        </div>
      </div>

      {/* Current User Footer */}
      <CurrentUserFooter
        name={currentUser.name}
        avatarUrl={currentUser.avatarUrl}
      />
    </div>
  )
}