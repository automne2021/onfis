import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import { buildWebSocketUrl } from '../../../utils/websocket';
import { chatApi } from '../services/chatApi';
import { type BackendMessageDTO, type ChatMessage, type MessageType } from '../types/chatTypes';
import { useCall } from '../context/CallContext';
import { usePresence } from '../context/PresenceContext';
interface CurrentUserInfo {
  id: string;
  name: string;
  avatarUrl: string;
}

export function useChat(conversationId: string, currentUser?: CurrentUserInfo) {
  const { tenant } = useParams<{ tenant: string }>();
  const { triggerIncomingCall, forceTerminate } = useCall();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const stompClient = useRef<Client | null>(null);
  const { statuses } = usePresence();

  const lastDateRef = useRef<string>("");
  const currentUserRef = useRef(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const resolveSenderInfo = useCallback((msg: BackendMessageDTO & { senderStatus?: "online" | "busy" | "offline" }) => {
    const user = currentUserRef.current; 

    if (user && msg.userId === user.id) {
      return {
        id: user.id,
        name: user.name, 
        avatarUrl: user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`,
        status: "online" as const 
      };
    }

    const rawName = msg.senderName || "Unknown User";
    const cleanName = rawName.replace(/\(You\)/g, '').trim(); 
    
    const currentLiveStatus = statuses[msg.userId];
    
    return {
      id: msg.userId,
      name: cleanName,
      avatarUrl: msg.senderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=random`,
      status: currentLiveStatus || msg.senderStatus || "offline" 
    };
  }, [statuses]);

  // Fetch lịch sử tin nhắn ban đầu
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data: BackendMessageDTO[] = await chatApi.getMessages(conversationId);
        let previousDate = ""; 

        const mappedData: ChatMessage[] = data.map((msg) => {
          const dateObj = msg.createdAt ? new Date(msg.createdAt) : new Date();
          const timeString = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          const dateString = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
          
          const dateSeparator = dateString !== previousDate ? dateString : undefined;
          if (dateSeparator) previousDate = dateString;

          return {
            id: msg.id,
            channelId: msg.conversationId,
            sender: resolveSenderInfo(msg),
            timestamp: timeString,
            dateSeparator,
            type: (msg.type === 'meeting' || msg.type === 'MEETING') ? 'meeting' : (msg.type.toLowerCase() as MessageType),
            content: msg.content || "",
            meeting: msg.meeting || undefined,
            file: msg.attachmentId ? { 
                name: msg.fileName || "Attached File", 
                size: msg.fileSize ? `${(msg.fileSize / (1024 * 1024)).toFixed(2)} MB` : "Unknown size", 
                type: "unknown", 
                url: msg.fileUrl || "#" 
            } : undefined
          };
        });

        lastDateRef.current = previousDate;
        setMessages(mappedData);
      } catch (error) { 
        console.error("Lỗi lấy lịch sử chat:", error); 
      }
    };

    if (conversationId) fetchHistory();
  }, [conversationId, resolveSenderInfo]);

  // Thiết lập WebSocket
  useEffect(() => {
    if (!conversationId) return;

    // Lấy token từ localStorage (Dựa theo key Supabase)
    const authKey = import.meta.env.VITE_SUPABASE_AUTH_KEY;
    const authDataString = localStorage.getItem(authKey);
    
    let token = null;
    let tenantId = "00000000-0000-0000-0000-000000000001"; 
    let userId = currentUserRef.current?.id || "";

    if (authDataString) {
      try {
        const authData = JSON.parse(authDataString);
        token = authData.access_token;
        
        if (authData.user) {
           userId = authData.user.id || userId;
           if (authData.user.app_metadata && authData.user.app_metadata.tenant_id) {
               tenantId = authData.user.app_metadata.tenant_id;
           }
        }
      } catch (e) {
        console.error("Lỗi parse dữ liệu từ localStorage", e);
      }
    }

    if (!token) {
      console.warn("⚠️ Không tìm thấy access_token với key:", authKey);
      return;
    }

    let isMounted = true; 

    const client = new Client({
      brokerURL: `${import.meta.env.VITE_WEBSOCKET_BASE_URL}/onfis/ws/websocket`, 
      connectHeaders: { 
        'Authorization': `Bearer ${token}`,
        'X-User-ID': userId, 
        'X-Company-ID': tenantId                      
      },
      debug: (str) => console.log("[STOMP Debug]:", str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      
      onConnect: () => {
        if (!isMounted) return;
        console.log("✅ Connected to STOMP successfully");
        setIsConnected(true);
        
        // Lắng nghe tin nhắn mới từ phòng chat
        client.subscribe(`/topic/room.${conversationId}`, (msg) => {
          const newMsg: BackendMessageDTO = JSON.parse(msg.body);

          const dateObj = new Date(newMsg.createdAt);
          const timeString = dateObj.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit', hour12: true});
          const dateString = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
          
          let newDateSeparator = undefined;
          if (dateString !== lastDateRef.current) {
            newDateSeparator = dateString;
            lastDateRef.current = dateString; 
          }
          
          const isMeeting = newMsg.type === 'meeting' || newMsg.type === 'MEETING';

          if (isMeeting && newMsg.userId !== userId && newMsg.meeting) {
            const callerInfo = resolveSenderInfo(newMsg);
            triggerIncomingCall({
                meetingId: newMsg.meeting.id,
                callerName: newMsg.senderName || "Unknown User",
                isVideo: newMsg.meeting.type === 'VIDEO',
                avatarUrl: callerInfo.avatarUrl
            });
          }

          const incomingMessage: ChatMessage = {
            id: newMsg.id,
            channelId: newMsg.conversationId,
            content: newMsg.content || (isMeeting ? "Started a meeting" : ""),
            type: (isMeeting ? 'meeting' : newMsg.attachmentId ? 'file' : 'text') as MessageType,
            meeting: newMsg.meeting ? newMsg.meeting : undefined,
            file: newMsg.attachmentId ? { 
                name: newMsg.fileName || "Attached File", 
                size: newMsg.fileSize ? `${(newMsg.fileSize / (1024 * 1024)).toFixed(2)} MB` : "Unknown size", 
                type: "unknown", 
                url: newMsg.fileUrl || "#" 
            } : undefined,
            timestamp: timeString,
            dateSeparator: newDateSeparator,
            sender: resolveSenderInfo(newMsg)
          };

          setMessages(prev => [...prev, incomingMessage]);
        });

        client.subscribe(`/topic/room.${conversationId}.meetingEnded`, (msg) => {
          const endedMeetingId = msg.body.replace(/"/g, ''); 
          setMessages(prev => prev.map(m => {
            if (m.meeting && m.meeting.id === endedMeetingId) {
              return {
                ...m,
                meeting: { ...m.meeting, status: 'ENDED' }
              };
            }
            return m;
          }));

          forceTerminate(endedMeetingId);
        });
        
        client.subscribe('/user/queue/errors', (errorMsg) => {
          const error = JSON.parse(errorMsg.body);
          console.error("Lỗi từ server:", error.message);
        });
      },
      
      onDisconnect: (frame) => {
        if (!isMounted) return;
        console.log("🛑 Disconnected from STOMP", frame);
        setIsConnected(false);
      },
      onWebSocketClose: (event) => console.warn("⚠️ WebSocket bị đóng đột ngột:", event),
      onWebSocketError: (event) => console.error("❌ Lỗi WebSocket cấp thấp:", event),
      onStompError: (frame) => {
        console.error('❌ Lỗi xác thực STOMP:', frame.headers['message']);
        console.error('Broker reported error: ' + frame.body);
      }
    });

    client.activate();
    stompClient.current = client;

    return () => {
      isMounted = false; 
      if (stompClient.current) stompClient.current.deactivate();
    };
  }, [conversationId, resolveSenderInfo, forceTerminate, triggerIncomingCall]);

  // Hàm gửi tin nhắn
  const sendMessage = useCallback((content: string, type: 'TEXT' | 'FILE' = 'TEXT', attachmentId?: string) => {
    if (stompClient.current && stompClient.current.connected) {
      const messageRequest = {
        conversationId: conversationId,
        content: content,
        type: type,
        attachmentId: attachmentId,
        parentId: null
      };

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
          console.error(e)
        }
      }

      stompClient.current.publish({
        destination: '/app/chat.sendMessage',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Company-ID': tenantId
        },
        body: JSON.stringify(messageRequest),
      });
    } else {
      console.error("Chưa kết nối tới server chat");
    }
  }, [conversationId]);

  return { messages, isConnected, sendMessage };
}