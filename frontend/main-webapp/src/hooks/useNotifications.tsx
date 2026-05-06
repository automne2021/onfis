import { useState, useEffect, useRef, useMemo } from 'react';
import { Client } from '@stomp/stompjs';
import { useNavigate, useParams } from 'react-router-dom';
import { buildWebSocketUrl } from '../utils/websocket';
import { useAuth } from './useAuth';
import type { ContentItem } from '../components/common/Dropdown/ContentList';

// Định nghĩa cấu trúc chuẩn cho 1 thông báo
interface AppNotification {
  id: string;
  title: string;
  subtitle: string;
  isRead: boolean;
  timestamp: number;
  url: string; 
}

export function useNotifications() {
  const { dbUser: currentUser } = useAuth();
  const { tenant } = useParams<{ tenant: string }>();
  const navigate = useNavigate();
  const stompClient = useRef<Client | null>(null);

  const [rawChatNotifs, setRawChatNotifs] = useState<AppNotification[]>([]);
  const [rawAnnouncementNotifs, setRawAnnouncementNotifs] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!currentUser?.id) return;

    const authKey = import.meta.env.VITE_SUPABASE_AUTH_KEY;
    const authDataString = localStorage.getItem(authKey);
    
    let token = "";
    let tenantId = "00000000-0000-0000-0000-000000000001";
    let departmentId = ""; 

    if (authDataString) {
      try {
        const authData = JSON.parse(authDataString);
        token = authData.access_token || "";
        
        if (authData.user) {
          if (authData.user.app_metadata?.tenant_id) {
            tenantId = authData.user.app_metadata.tenant_id;
          }
          departmentId = authData.user.user_metadata?.department_id 
                      || authData.user.app_metadata?.department_id 
                      || "";
        }
      } catch (e) { console.error(e); }
    }

    const client = new Client({
      brokerURL: buildWebSocketUrl(tenant ?? 'onfis'),
      connectHeaders: { 
        'Authorization': `Bearer ${token}`,
        'X-User-ID': currentUser.id, 
        'X-Company-ID': tenantId 
      },
      reconnectDelay: 5000,
      
      onConnect: () => {
        console.log("🔔 Connected to Global Notifications");

        // 1. Lắng nghe tin nhắn CHAT mới
        client.subscribe(`/topic/user.${currentUser.id}.chat_notifications`, (msg) => {
          const data = JSON.parse(msg.body);
          
          const newNotif: AppNotification = {
            id: data.id,
            title: data.senderName || 'Unknown User', 
            subtitle: "Sent a new message",
            isRead: false,
            timestamp: Date.now(),
            url: `/onfis/discuss?channel=${data.conversationId}` 
          };
          setRawChatNotifs(prev => [newNotif, ...prev]);
        });

        // 2. Lắng nghe ANNOUNCEMENT Toàn công ty
        client.subscribe(`/topic/tenant.${tenantId}.announcements`, (msg) => {
          const data = JSON.parse(msg.body);
          const newNotif: AppNotification = {
            id: data.id,
            title: "Global Announcement",
            subtitle: data.title,
            isRead: false,
            timestamp: Date.now(),
            url: `/onfis/announcements/${data.id}/${data.title}`
          };
          setRawAnnouncementNotifs(prev => [newNotif, ...prev]);
        });

        // 3. Lắng nghe ANNOUNCEMENT Phòng ban
        if (departmentId) {
          client.subscribe(`/topic/department.${departmentId}.announcements`, (msg) => {
            const data = JSON.parse(msg.body);
            const newNotif: AppNotification = {
              id: data.id,
              title: "Department Announcement",
              subtitle: data.title,
              isRead: false,
              timestamp: Date.now(),
              url: `/onfis/announcements/${data.id}/${data.title}`
            };
            setRawAnnouncementNotifs(prev => [newNotif, ...prev]);
          });
        }
      },
    });

    client.activate();
    stompClient.current = client;

    return () => {
      if (stompClient.current) stompClient.current.deactivate();
    };
  }, [currentUser?.id]);

  // Hàm chuyển đổi Timestamp sang Giờ:Phút
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const markAsRead = (type: 'chat' | 'announcement', id: string) => {
    if (type === 'chat') {
      setRawChatNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } else {
      setRawAnnouncementNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    }
  };

  const unreadChatCount = rawChatNotifs.filter(n => !n.isRead).length;
  const unreadAnnouncementCount = rawAnnouncementNotifs.filter(n => !n.isRead).length;

  // --- MAP CHAT NOTIFICATIONS ---
  const chatNotifs: ContentItem[] = useMemo(() => {
    const items: ContentItem[] = rawChatNotifs.map(n => ({
      content: (
        <div className={`flex flex-col px-0 gap-1 rounded-lg transition-colors`}>
          <div className="flex justify-between items-center gap-4">
             <span className={`text-sm ${n.isRead ? 'font-medium text-neutral-600' : 'font-bold text-neutral-900'}`}>
              {n.title}
            </span>
            <span className="text-[10px] text-neutral-400 whitespace-nowrap">{formatTime(n.timestamp)}</span>
          </div>
          <span className="text-xs text-neutral-500">{n.subtitle}</span>
        </div>
      ),
      onClick: () => {
        markAsRead('chat', n.id);
        navigate(n.url);
      }
    }));

    // Bổ sung nút Clear All nếu mảng có dữ liệu
    if (rawChatNotifs.length > 0) {
      items.push({
        content: (
          <div className="w-full text-center py-2 mt-1 text-[13px] font-bold text-primary hover:text-blue-700 transition-colors border-t border-neutral-100">
            Clear all notifications
          </div>
        ),
        onClick: () => setRawChatNotifs([]) // Xóa sạch mảng
      });
    }
    return items;
  }, [rawChatNotifs, navigate]);

  // --- MAP ANNOUNCEMENT NOTIFICATIONS ---
  const announcementNotifs: ContentItem[] = useMemo(() => {
    const items: ContentItem[] = rawAnnouncementNotifs.map(n => ({
      content: (
        <div className={`flex flex-col gap-1 rounded-lg transition-colors ${n.isRead ? 'bg-transparent' : 'bg-neutral-100'}`}>
          <div className="flex justify-between items-center gap-4">
             <span className={`text-[11px] uppercase tracking-wider ${n.isRead ? 'text-neutral-400 font-medium' : 'text-primary font-bold'}`}>
              {n.title}
            </span>
            <span className="text-[10px] text-neutral-400 whitespace-nowrap">{formatTime(n.timestamp)}</span>
          </div>
          <span className={`text-sm line-clamp-2 ${n.isRead ? 'font-medium text-neutral-600' : 'font-bold text-neutral-900'}`}>
            {n.subtitle}
          </span>
        </div>
      ),
      onClick: () => {
        markAsRead('announcement', n.id);
        navigate(n.url);
      }
    }));

    // Bổ sung nút Clear All
    if (rawAnnouncementNotifs.length > 0) {
      items.push({
        content: (
          <div className="w-full text-center py-2 mt-1 text-[13px] font-bold text-primary hover:text-blue-700 transition-colors border-t border-neutral-100">
            Clear all notifications
          </div>
        ),
        onClick: () => setRawAnnouncementNotifs([]) 
      });
    }
    return items;
  }, [rawAnnouncementNotifs, navigate]);

  return { 
    chatNotifs, 
    announcementNotifs, 
    unreadChatCount, 
    unreadAnnouncementCount 
  };
}