import { Hash, Lock, Search, X, User } from 'lucide-react'; 
import { useState, useEffect, useRef } from 'react';
import { Button } from "../../../../components/common/Buttons/Button";
import type { ActionModalState, ChatChannel } from "../../types/chatTypes";
import { ChatGroup } from "./ChatGroup";
import { ChatItem } from "./ChatItem";
import { CurrentUserFooter } from "./CurrentUserFooter";
import { useDebounce } from '../../hooks/useDebounce';

// Import API client của bạn
import { userApi } from '../../services/userApi';
import { chatApi } from '../../services/chatApi';
import { ActionModal } from '../Modal/ActionModal';
import { usePresence } from '../../context/PresenceContext';

interface ChatSidebarProps {
  channels: ChatChannel[];
  activeChannelId: string;
  onChannelSelect: (id: string) => void;
  icons?: Record<string, React.ReactNode>;
  onCreateGroupClick: () => void;
  isLoading?: boolean; 
  onRefreshChannels?: (silent?: boolean) => void; 
}

interface SearchResult {
  users: Array<{ id: string; name: string; email: string; avatarUrl: string | null }>;
  groups: Array<{ id: string; name: string; isPrivate: boolean }>;
}

interface BackendUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  avatarUrl: string | null;
}

function SidebarSkeleton() {
  return (
    <div className="flex flex-col gap-2 px-2 mt-4 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2">
          <div className="w-5 h-5 bg-neutral-200 rounded flex-shrink-0" />
          <div className="h-4 bg-neutral-200 rounded w-full" />
        </div>
      ))}
    </div>
  );
}

export function ChatSidebar({ 
  channels, activeChannelId, onChannelSelect, icons, onCreateGroupClick, isLoading, onRefreshChannels 
}: ChatSidebarProps) {

  const pinnedChannels = channels.filter(c => c.isPinned);
  const unpinned = channels.filter(c => !c.isPinned);
  const projectGroups = unpinned.filter(c => c.type === 'public_group' || c.type === 'private_group');
  const directMessages = unpinned.filter(c => c.type === 'direct').slice(0, 10);
  const selfChats = unpinned.filter(channel => channel.type === 'self');

  const { statuses } = usePresence();

  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [actionModal, setActionModal] = useState<ActionModalState>({ type: null, channelId: '', channelName: '' });
  const [newChannelName, setNewChannelName] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500); 
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debouncedSearchTerm.trim() === "") {
      setSearchResults(null);
      setIsDropdownOpen(false);
      return;
    }

    const fetchSearchResults = async () => {
      setIsSearching(true);
      setIsDropdownOpen(true);
      try {
        const [userRes, groupRes] = await Promise.all([
          userApi.searchUsers(debouncedSearchTerm), 
          chatApi.searchGroups(debouncedSearchTerm) 
        ]);

        const formattedUsers = userRes.map((u: BackendUser) => ({
          id: u.id,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
          email: u.email,
          avatarUrl: u.avatarUrl
        }));

        setSearchResults({
          users: formattedUsers,
          groups: groupRes 
        });

      } catch (error) {
        console.error("Lỗi tìm kiếm:", error);
      } finally {
        setIsSearching(false);
      }
    };

    fetchSearchResults();
  }, [debouncedSearchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResultClick = async (type: 'user' | 'group', id: string, name: string) => {
    setIsDropdownOpen(false);
    setSearchTerm("");
    
    if (type === 'group') {
      onChannelSelect(id);
    } 
    else if (type === 'user') {
      const existingDm = channels.find(
        (c) => c.type === 'direct' && c.name.trim().toLowerCase() === name.trim().toLowerCase()
      );

      if (existingDm) {
        onChannelSelect(existingDm.id);
      } else {
        try {
          const newConversation = await chatApi.createConversation({
            name: name, 
            type: 'direct',
            memberIds: [id] 
          });
          
          if (newConversation && newConversation.id) {
            if (onRefreshChannels) {
                await onRefreshChannels(); 
            }
            onChannelSelect(newConversation.id);
          }
        } catch (error) {
          console.error("Lỗi khi tạo phòng chat direct mới:", error);
        }
      }
    }
  };

  const handleActionSubmit = async () => {
    if (!actionModal.channelId) return;
    setIsActionLoading(true);

    try {
      if (actionModal.type === 'rename') {
        const formattedName = newChannelName.trim().replace(/\s+/g, '-');
        if (formattedName && formattedName !== actionModal.channelName) {
          await chatApi.renameConversation(actionModal.channelId, formattedName);
        }
      } else if (actionModal.type === 'delete') {
        await chatApi.deleteConversation(actionModal.channelId);
        if (activeChannelId === actionModal.channelId) {
          onChannelSelect(""); 
        }
      }
      
      if (onRefreshChannels) await onRefreshChannels(true); 
      
      setActionModal({ type: null, channelId: '', channelName: '' });
    } catch (e) {
      console.error("Execution Error:", e);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full justify-between bg-white relative">
      <div className="flex flex-col overflow-y-auto min-h-0 flex-1">
        
        {/* Header Messages */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
          <p className="header-h6 leading-none text-neutral-900">Messages</p>
          <Button
            id="edit-chat"
            iconLeft={icons?.['edit']}
            onClick={onCreateGroupClick} 
            style='primary'
            type="button"
            border={false}
            size="square"
          />
        </div>

        {/* Khung Search Bar & Dropdown */}
        <div className="px-4 py-3 relative z-20" ref={dropdownRef}>
          <div className="relative flex items-center">
            <Search size={16} className="absolute left-3 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search people, groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => { if (searchTerm.trim().length > 0) setIsDropdownOpen(true); }}
              className="w-full h-9 pl-9 pr-8 bg-neutral-100 border border-transparent rounded-lg text-sm focus:outline-none focus:bg-white focus:border-primary transition-colors placeholder:text-neutral-500"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-2 p-1 text-neutral-400 hover:text-neutral-600 rounded-full"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Dropdown Kết Quả */}
          {isDropdownOpen && (
            <div className="absolute top-full left-4 right-4 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden max-h-[350px] overflow-y-auto z-50 flex flex-col custom-scrollbar">
              {isSearching ? (
                <div className="p-4 text-center text-sm text-neutral-500 animate-pulse">Searching...</div>
              ) : searchResults ? (
                <>
                  {/* Danh sách Nhân viên (Users) */}
                  {searchResults.users.length > 0 && (
                    <div className="flex flex-col">
                      <span className="px-3 py-2 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider bg-neutral-50 sticky top-0 z-10">People</span>
                      {searchResults.users.map(u => (
                        <div 
                          key={u.id} 
                          onClick={() => handleResultClick('user', u.id, u.name)}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-neutral-50 cursor-pointer transition"
                        >
                          <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt={u.name} className="w-full h-full rounded-full object-cover"/>
                            ) : (
                              <User size={14} className="text-neutral-500"/>
                            )}
                          </div>
                          <div className="flex flex-col truncate">
                            <span className="text-sm font-medium text-neutral-900 truncate">{u.name}</span>
                            <span className="text-[11px] text-neutral-500 truncate">{u.email}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Danh sách Nhóm (Groups) */}
                  {searchResults.groups.length > 0 && (
                    <div className="flex flex-col">
                      <span className="px-3 py-2 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider bg-neutral-50 sticky top-0 z-10">Groups</span>
                      {searchResults.groups.map(g => (
                        <div 
                          key={g.id} 
                          onClick={() => handleResultClick('group', g.id, g.name)}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-neutral-50 cursor-pointer transition"
                        >
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-primary flex items-center justify-center flex-shrink-0">
                            {g.isPrivate ? <Lock size={14} /> : <Hash size={14} />}
                          </div>
                          <span className="text-sm font-medium text-neutral-900 truncate">{g.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Trạng thái không tìm thấy */}
                  {searchResults.users.length === 0 && searchResults.groups.length === 0 && (
                    <div className="p-6 flex flex-col items-center justify-center text-center gap-2">
                      <Search size={24} className="text-neutral-300" />
                      <span className="text-sm text-neutral-500">No results found for "{searchTerm}"</span>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          )}
        </div>

        {/* Danh sách Channels cũ (Mờ đi khi đang mở dropdown tìm kiếm) */}
        <div className={`flex flex-col gap-2 transition-opacity duration-200 ${isDropdownOpen ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
          {isLoading ? (
            <SidebarSkeleton />
          ) : (
            <>
              {pinnedChannels.length > 0 && (
                <ChatGroup title="Pinned">
                  {pinnedChannels.map((channel) => {
                    const isPrivate = channel.type === 'private_group';
                    const isDirect = channel.type === 'direct';
                    const isSelf = channel.type === 'self';

                    return (
                      <ChatItem
                        key={channel.id}
                        name={channel.name}
                        isActive={activeChannelId === channel.id}
                        onClick={() => onChannelSelect(channel.id)}
                        icon={isPrivate ? <Lock size={16} /> : isDirect ? <User size={16} /> : <Hash size={16} />}
                        avatarUrl={channel.avatarUrl}
                        status={channel.status}
                        
                        // logic phân quyền: 
                        // 1. Nếu là chat Direct hoặc Self -> Luôn cho phép Rename/Delete (để ẩn/xóa hội thoại cá nhân)
                        // 2. Nếu là Group (Public/Private) -> Phải có cờ canManage = true từ Backend
                        onRename={(isDirect || isSelf || channel.canManage) ? () => {
                          setNewChannelName(channel.name);
                          setActionModal({ type: 'rename', channelId: channel.id, channelName: channel.name });
                        } : undefined}
                        
                        onDelete={(isDirect || isSelf || channel.canManage) ? () => {
                          setActionModal({ type: 'delete', channelId: channel.id, channelName: channel.name });
                        } : undefined}
                      />
                    );
                  })}
                </ChatGroup>
              )}

              <ChatGroup title="channels">
                {projectGroups.map((channel) => {
                  const isPrivate = channel.type === 'private_group';
                  return (
                    <ChatItem
                      key={channel.id}
                      name={channel.name}
                      isActive={activeChannelId === channel.id}
                      onClick={() => onChannelSelect(channel.id)}
                      icon={isPrivate ? <Lock size={16} /> : <Hash size={16} />}
                      onRename={channel.canManage ? () => {
                        setNewChannelName(channel.name);
                        setActionModal({ type: 'rename', channelId: channel.id, channelName: channel.name });
                      } : undefined}
                      
                      onDelete={channel.canManage ? () => {
                        setActionModal({ type: 'delete', channelId: channel.id, channelName: channel.name });
                      } : undefined}
                    />
                  );
                })}
              </ChatGroup>

              {directMessages.length > 0 && (
                <ChatGroup title="Direct Messages">
                  {directMessages.map((channel) => {
                    const cleanName = (channel.name || "User").replace(/\(You\)/g, '').trim();
                    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=random`;
                    const liveStatus = channel.targetUserId && statuses[channel.targetUserId]
                                      ? statuses[channel.targetUserId]
                                      : channel.status || "offline";
                    return (
                      <ChatItem
                        key={channel.id}
                        name={channel.name} 
                        avatarUrl={channel.avatarUrl || defaultAvatar} 
                        status={liveStatus}
                        isActive={activeChannelId === channel.id}
                        onClick={() => onChannelSelect(channel.id)}
                      />
                    );
                  })}
                </ChatGroup>
              )}
              
              <ChatGroup title="Saved Messages">
                {selfChats.map((channel) => {
                  const cleanName = (channel.name || "You").replace(/\(You\)/g, '').trim();
                  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=random`;
                  const liveStatus = channel.targetUserId && statuses[channel.targetUserId]
                                    ? statuses[channel.targetUserId]
                                    : channel.status || "online";
                  return (
                    <ChatItem
                      key={channel.id}
                      name={channel.name} 
                      avatarUrl={channel.avatarUrl || defaultAvatar} 
                      status={liveStatus}
                      isActive={activeChannelId === channel.id}
                      onClick={() => onChannelSelect(channel.id)}
                    />
                  );
                })}
              </ChatGroup>
            </>
          )}
        </div>
      </div>

      <CurrentUserFooter />

      <ActionModal
        actionModal={actionModal}
        newChannelName={newChannelName}
        setNewChannelName={setNewChannelName}
        setActionModal={setActionModal}
        isActionLoading={isActionLoading}
        handleActionSubmit={handleActionSubmit}
      />
    </div>
  );
}