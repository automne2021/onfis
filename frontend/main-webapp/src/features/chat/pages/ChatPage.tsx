import { useState } from "react"
import { Menu } from '@mui/icons-material';
import { ChatSidebar } from "../components/Sidebar/ChatSidebar";
import { SquarePen, Hash } from 'lucide-react';
import { ChatWindow } from "../components/MainArea/ChatWindow";
import { useConversations } from "../hooks/useConversations";

import { chatApi } from "../services/chatApi";
import { CreateGroupModal } from "../components/Modal/CreateGroupModal";
import { CallProvider } from "../context/CallContext";

export function ChatPage() {

  const { channels, fetchChannels, isLoading } = useConversations();

  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const activeChannelId = selectedChannelId || (channels.length > 0 ? channels[0].id : null);
  const currentChannel = channels.find(c => c.id === activeChannelId) || null;

  const handleCreateGroup = async (data: { name: string; type: 'public_group' | 'private_group'; memberIds: string[] }) => {
    try {
      await chatApi.createConversation(data);
      setIsCreateModalOpen(false);
      fetchChannels(); 
    } catch (error) {
      console.error("Lỗi khi tạo nhóm", error);
      alert("Đã xảy ra lỗi khi tạo nhóm!");
    }
  };

  const toggleMenu = () => setIsMobileMenuOpen(prev => !prev)

  return (
    <CallProvider>
      <section className="chat-section relative">
        <CreateGroupModal 
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateGroup}
        />

        {isMobileMenuOpen && (
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden absolute inset-0 bg-black/20 z-20"
          />
        )}

        <div
          className={`
          absolute md:relative z-30 h-full w-[280px] border-r border-neutral-200 flex-shrink-0 flex flex-col transition-transform duration-300 ease-in-out bg-neutral-50 
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        >
          <ChatSidebar
            channels={channels} 
            isLoading={isLoading}
            activeChannelId={activeChannelId || ""}
            onChannelSelect={(id) => { setSelectedChannelId(id); setIsMobileMenuOpen(false); }}
            icons={{ 'edit': <SquarePen size={18} />, 'hash': <Hash /> }}
            onCreateGroupClick={() => setIsCreateModalOpen(true)}
            onRefreshChannels={fetchChannels}
          />
        </div>

        {/* MAIN CHAT */}
        <div className="flex-1 flex flex-col min-w-0 bg-white relative z-10">

          <div className="md:hidden flex items-center px-4 h-[60px] flex-shrink-0">
            <button
              onClick={() => toggleMenu()}
              className="p-2 -ml-2 text-neutral-500 hover:bg-neutral-50 rounded-full transition-colors"
            >
              <Menu />
            </button>
          </div>

          <div className="flex-1 overflow-hidden min-h-0">
            {activeChannelId && (
              <ChatWindow 
                activeChannelId={activeChannelId} 
                currentChannel={currentChannel} 
              />
            )}
          </div>

        </div>

      </section>
    </CallProvider>
  )
}