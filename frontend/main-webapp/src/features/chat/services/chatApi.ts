import api from "../../../services/api";

export const chatApi = {
  
  // Lấy danh sách phòng chat cho Sidebar
  getConversations: async () => {
    const response = await api.get('/chat/conversations');
    return response.data;
  },

  // Lấy lịch sử tin nhắn của một phòng cụ thể
  getMessages: async (conversationId: string) => {
    const response = await api.get(`/chat/conversations/${conversationId}/messages`);
    return response.data;
  },

};