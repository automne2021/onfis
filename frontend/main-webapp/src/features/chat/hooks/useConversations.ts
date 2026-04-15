import { useState, useEffect } from 'react';
import { chatApi } from '../services/chatApi';
import type { ChatChannel } from '../types/chatTypes';

export function useConversations() {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        setIsLoading(true);
        // Thay vì dùng fetch, gọi qua Axios
        const data = await chatApi.getConversations(); 
        setChannels(data);
      } catch (error) {
        console.error("Lỗi tải danh sách phòng:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChannels();
  }, []);

  return { channels, isLoading };
}