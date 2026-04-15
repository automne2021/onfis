import { useState } from "react"
import { Menu } from '@mui/icons-material';
import { ChatSidebar } from "../components/Sidebar/ChatSidebar";
import { SquarePen, Hash } from 'lucide-react';
import { ChatWindow } from "../components/MainArea/ChatWindow";
import { useConversations } from "../hooks/useConversations";

export function ChatPage() {

  // useState
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { channels } = useConversations();

  const currentChannel = channels.find(c => c.id === activeChannelId) || null;

  if (!activeChannelId && channels.length > 0) {
    setActiveChannelId(channels[0].id);
  }

  // Functions
  const toggleMenu = () => setIsMobileMenuOpen(prev => !prev)

  return (
    <section className="chat-section">

      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="md:hidden absolute inset-0 bg-black/20 z-20"
        />
      )}

      {/* SIDEBAR */}
      <div
        className={`
        absolute md:relative z-30 h-full w-[280px] border-r border-neutral-200 flex-shrink-0 flex flex-col transition-transform duration-300 ease-in-out bg-neutral-50 
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
      >
        <ChatSidebar
          channels={channels} // Truyền data thật
          activeChannelId={activeChannelId || ""}
          onChannelSelect={(id) => { setActiveChannelId(id); setIsMobileMenuOpen(false); }}
          icons={{ 'edit': <SquarePen size={18} />, 'hash': <Hash /> }}
        />
      </div>

      {/* MAIN CHAT */}
      <div className="flex-1 flex flex-col min-w-0 bg-white relative z-10">

        {/* Header (Only display on mobile) to open Menu */}
        <div className="md:hidden flex items-center px-4 h-[60px] flex-shrink-0">
          <button
            onClick={() => toggleMenu()}
            className="p-2 -ml-2 text-neutral-500 hover:bg-neutral-50 rounded-full transition-colors"
          >
            <Menu />
          </button>
        </div>

        <div className="flex-1 overflow-hidden min-h-0">
          {/* Truyền currentChannel xuống ChatWindow */}
          {activeChannelId && (
             <ChatWindow 
               activeChannelId={activeChannelId} 
               currentChannel={currentChannel} 
             />
          )}
        </div>

      </div>

    </section>
  )
}