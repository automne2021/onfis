import { useState, useEffect } from "react" 
import { Menu } from '@mui/icons-material';
import { ChatSidebar } from "../components/Sidebar/ChatSidebar";
import { SquarePen, Hash } from 'lucide-react';
import { ChatWindow } from "../components/MainArea/ChatWindow";
import { useConversations } from "../hooks/useConversations";

import { chatApi } from "../services/chatApi";
import { CreateGroupModal } from "../components/Modal/CreateGroupModal";
import { CallProvider } from "../context/CallContext";
import { useSearchParams } from "react-router-dom"; 

export function ChatPage() {

  const { channels, fetchChannels, isLoading } = useConversations();
  const [searchParams, setSearchParams] = useSearchParams();
  const channelFromUrl = searchParams.get('channel');

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // KIỂM TRA TÍNH HỢP LỆ CỦA URL
  // Kiểm tra xem ID trên URL có thực sự nằm trong danh sách phòng của user không
  const isChannelValid = channels.some(c => c.id === channelFromUrl);

  // XÁC ĐỊNH PHÒNG ĐANG MỞ AN TOÀN
  let activeChannelId: string | null = null;
  // Nếu URL có ID hợp lệ (hoặc đang loading chưa biết hợp lệ hay không), thì tin tưởng URL
  if (channelFromUrl && (isChannelValid || isLoading)) {
    activeChannelId = channelFromUrl;
  } else if (channels.length > 0) {
    // Nếu URL sai hoặc trống, fallback về phòng đầu tiên
    activeChannelId = channels[0].id;
  }

  const currentChannel = channels.find(c => c.id === activeChannelId) || null;

  // TỰ ĐỘNG CẬP NHẬT LẠI URL NẾU SAI
  useEffect(() => {
    // Chỉ xử lý sau khi đã tải xong danh sách phòng từ Backend
    if (!isLoading) {
      if (channelFromUrl && !isChannelValid) {
        // Trường hợp 1: Có ID trên URL nhưng bị sai/không có quyền -> Ép về phòng số 1
        if (channels.length > 0) {
          setSearchParams({ channel: channels[0].id }, { replace: true });
        }
      } else if (!channelFromUrl && channels.length > 0) {
        // Trường hợp 2: URL trống trơn -> Tự điền ID phòng số 1 vào
        setSearchParams({ channel: channels[0].id }, { replace: true });
      }
    }
  }, [isLoading, channelFromUrl, isChannelValid, channels, setSearchParams]);

  // Hàm xử lý khi click Sidebar
  const handleChannelSelect = (id: string) => {
    setSearchParams({ channel: id }); 
    setIsMobileMenuOpen(false);       
  };

  const handleCreateGroup = async (data: { name: string; type: 'public_group' | 'private_group'; memberIds: string[] }) => {
    try {
      const newGroup = await chatApi.createConversation(data);
      setIsCreateModalOpen(false);
      fetchChannels(); 
      if (newGroup && newGroup.id) {
        setSearchParams({ channel: newGroup.id });
      }
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
            onChannelSelect={handleChannelSelect}
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
                onRefreshChannels={fetchChannels}
              />
            )}
          </div>

        </div>

      </section>
    </CallProvider>
  )
}