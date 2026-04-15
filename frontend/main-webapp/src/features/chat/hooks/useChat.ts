import { useState, useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
// import SockJS from 'sockjs-client';
import { chatApi } from '../services/chatApi';
import { type BackendMessageDTO, type ChatMessage, type MessageType } from '../types/chatTypes';

export function useChat(conversationId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const stompClient = useRef<Client | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data: BackendMessageDTO[] = await chatApi.getMessages(conversationId);
        
        let previousDate = ""; 

        const mappedData: ChatMessage[] = data.map((msg) => {
          const dateObj = new Date(msg.createdAt);
          const timeString = dateObj.toLocaleTimeString('en-US', { 
            hour: 'numeric', minute: '2-digit', hour12: true 
          });
          
          const dateString = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
          let dateSeparator = undefined;
          if (dateString !== previousDate) {
            dateSeparator = dateString; 
            previousDate = dateString;
          }

          const senderInfo = {
            id: msg.userId,
            name: msg.senderName || "Unknown User",
            avatarUrl: msg.senderAvatar || "https://via.placeholder.com/150",
            status: "online" as const 
          };

          return {
            id: msg.id,
            channelId: msg.conversationId,
            sender: senderInfo,
            timestamp: timeString,
            dateSeparator: dateSeparator,
            type: msg.type.toLowerCase() as MessageType, 
            content: msg.content,
            file: msg.attachmentId ? {
                name: "Attached File", size: "Unknown", type: "unknown", url: "#"
            } : undefined
          };
        });

        setMessages(mappedData);
      } catch (error) {
        console.error("Lỗi lấy lịch sử chat:", error);
      }
    };
    
    if (conversationId) fetchHistory();
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;

    const authKey = import.meta.env.VITE_SUPABASE_AUTH_KEY;
    const authDataString = localStorage.getItem(authKey);
    
    let token = null;
    if (authDataString) {
      try {
        const authData = JSON.parse(authDataString);
        token = authData.access_token;
      } catch (e) {
        console.error("Lỗi parse dữ liệu từ localStorage", e);
      }
    }

    if (!token) {
      console.warn("⚠️ Không tìm thấy access_token với key:", authKey);
      return;
    }

    const client = new Client({
      // Trong thực tế, bạn có thể đưa URL này vào biến môi trường: process.env.NEXT_PUBLIC_CHAT_WS_URL
      // webSocketFactory: () => new SockJS('http://localhost:8085/ws'),
      brokerURL: 'ws://localhost:8080/onfis/ws/websocket',
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: (str) => console.log(str),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("Connected to STOMP");
        setIsConnected(true);
        
        client.subscribe(`/topic/room.${conversationId}`, (msg) => {
          const newMsg: BackendMessageDTO = JSON.parse(msg.body);
          
          setMessages(prev => [...prev, {
            id: newMsg.id,
            channelId: newMsg.conversationId,
            content: newMsg.content,
            type: newMsg.type === 'TEXT' ? 'text' : 'file',
            timestamp: new Date(newMsg.createdAt).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit', hour12: true}),
            
            // Dùng dữ liệu thật từ package tin nhắn realtime
            sender: {
               id: newMsg.userId,
               name: newMsg.senderName || "Unknown User",
               avatarUrl: newMsg.senderAvatar || "https://via.placeholder.com/150",
               status: "online"
            }
          }]);
        });
        
        client.subscribe('/user/queue/errors', (errorMsg) => {
           const error = JSON.parse(errorMsg.body);
           alert(`Lỗi: ${error.message}`); // Nên thay thế bằng Toast Component của dự án
        });
      },
      onDisconnect: () => {
        setIsConnected(false);
      },
      onStompError: (frame) => {
        console.error('❌ Lỗi xác thực STOMP:', frame.headers['message']);
        console.error('Broker reported error: ' + frame.headers['message']);
      }
    });

    client.activate();
    stompClient.current = client;

    return () => {
      if (stompClient.current) {
        stompClient.current.deactivate();
      }
    };
  }, [conversationId]);

  // 3. Hàm gửi tin nhắn
  const sendMessage = useCallback((content: string, type: 'TEXT' | 'FILE' = 'TEXT', attachmentId?: string) => {
    if (stompClient.current && stompClient.current.connected) {
      const messageRequest = {
        conversationId: conversationId,
        content: content,
        type: type,
        attachmentId: attachmentId,
        parentId: null
      };

      stompClient.current.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(messageRequest),
      });
    } else {
      console.error("Chưa kết nối tới server chat");
    }
  }, [conversationId]);

  return { messages, isConnected, sendMessage };
}