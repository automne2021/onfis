import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';

type StatusMap = Record<string, "online" | "offline" | "busy">;

interface PresenceContextType {
  statuses: StatusMap;
}

const PresenceContext = createContext<PresenceContextType>({ statuses: {} });

export const PresenceProvider = ({ children }: { children: React.ReactNode }) => {
  const [statuses, setStatuses] = useState<StatusMap>({});
  const stompClient = useRef<Client | null>(null);

  useEffect(() => {
    // 1. Lấy thông tin xác thực giống như trong useChat
    const authKey = import.meta.env.VITE_SUPABASE_AUTH_KEY;
    const authDataString = localStorage.getItem(authKey);
    
    let token = "";
    let tenantId = "00000000-0000-0000-0000-000000000001";
    let userId = "";

    if (authDataString) {
      try {
        const authData = JSON.parse(authDataString);
        token = authData.access_token || "";
        if (authData.user) {
           userId = authData.user.id || "";
           if (authData.user.app_metadata?.tenant_id) {
               tenantId = authData.user.app_metadata.tenant_id;
           }
        }
      } catch (e) {
        console.error("Presence Context parse error:", e);
      }
    }

    if (!token) return;

    // 2. Khởi tạo một kết nối STOMP toàn cục chỉ dành cho Presence
    const client = new Client({
      brokerURL: 'ws://localhost:8080/onfis/ws/websocket', 
      connectHeaders: { 
        'Authorization': `Bearer ${token}`,
        'X-User-ID': userId, 
        'X-Company-ID': tenantId                      
      },
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("🟢 Global Presence STOMP Connected");
        // Lắng nghe trạng thái của tất cả mọi người
        client.subscribe('/topic/users.status', (msg) => {
          const payload = JSON.parse(msg.body); // { userId: "...", status: "online" }
          
          setStatuses(prev => ({
            ...prev,
            [payload.userId]: payload.status
          }));
        });
      }
    });

    client.activate();
    stompClient.current = client;

    return () => {
      if (stompClient.current) stompClient.current.deactivate();
    };
  }, []);

  return (
    <PresenceContext.Provider value={{ statuses }}>
      {children}
    </PresenceContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const usePresence = () => useContext(PresenceContext);