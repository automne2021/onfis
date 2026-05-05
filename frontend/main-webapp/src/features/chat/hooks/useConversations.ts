import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Client } from '@stomp/stompjs'; 
import { buildWebSocketUrl } from '../../../utils/websocket';
import { chatApi } from '../services/chatApi';
import type { ChatChannel } from '../types/chatTypes';
import { useAuth } from '../../../hooks/useAuth';

export function useConversations() {
  const { tenant } = useParams<{ tenant: string }>();
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth(); 
  
  const stompClient = useRef<Client | null>(null);

  const fetchChannels = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true); 
      const data = await chatApi.getConversations(); 
      setChannels(data);
    } catch (error) {
      console.error("Lỗi tải danh sách phòng:", error);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  useEffect(() => {
    if (!user?.id || stompClient.current) return;

    const authKey = import.meta.env.VITE_SUPABASE_AUTH_KEY;
    const authDataString = localStorage.getItem(authKey);
    
    let token = "";
    let tenantId = "00000000-0000-0000-0000-000000000001";

    if (authDataString) {
      try {
        const authData = JSON.parse(authDataString);
        token = authData.access_token || "";
        if (authData.user?.app_metadata?.tenant_id) {
            tenantId = authData.user.app_metadata.tenant_id;
        }
      } catch (e) {
        console.error("Lỗi parse auth data:", e);
      }
    }

    const client = new Client({
      brokerURL: buildWebSocketUrl(tenant ?? 'onfis'), 
      connectHeaders: {
        'Authorization': `Bearer ${token}`,
        'X-User-ID': user.id,
        'X-Company-ID': tenantId
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log("✅ Sidebar WebSocket Authenticated & Connected");
        client.subscribe(`/topic/sidebar.${user.id}`, () => {
          console.log("🔔 Nhận được tín hiệu cập nhật Sidebar!");
          fetchChannels(true); 
        });
      },
      onStompError: (frame) => {
        console.error('❌ Sidebar Stomp Error:', frame.headers['message']);
      }
    });

    client.activate();
    stompClient.current = client;

    return () => {
      if (stompClient.current) {
        stompClient.current.deactivate();
        stompClient.current = null;
      }
    };
  }, [user?.id, fetchChannels]);

  return { channels, isLoading, fetchChannels };
}