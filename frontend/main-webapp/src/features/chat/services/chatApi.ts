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

  createConversation: async (data: { name: string; type: string; memberIds: string[] }) => {
    const response = await api.post('/chat/conversations', data);
    return response.data;
  },

  searchGroups: async (keyword: string) => {
    const response = await api.get(`/chat/groups/search?q=${keyword}`);
    return response.data;
  },

  renameConversation: async (conversationId: string, newName: string) => {
    const response = await api.put(`/chat/conversations/${conversationId}`, { name: newName });
    return response.data;
  },

  deleteConversation: async (conversationId: string) => {
    const response = await api.delete(`/chat/conversations/${conversationId}`);
    return response.data;
  },

  addMemberToGroup: async (conversationId: string, userId: string) => {
    const response = await api.post(`/chat/conversations/${conversationId}/members`, { userId });
    return response.data;
  },
  
  getConversationMembers: async (conversationId: string) => {
    const response = await api.get(`/chat/conversations/${conversationId}/members`);
    return response.data;
  },

  updateConversation: async (conversationId: string, data: { name?: string; type?: string }) => {
    const response = await api.put(`/chat/conversations/${conversationId}/type`, data);
    return response.data;
  },

  togglePinConversation: async (conversationId: string) => {
    const response = await api.put(`/chat/conversations/${conversationId}/pin`);
    return response.data;
  },

  /* ****************************** */
  /* *********** MEETING ********** */
  /* ****************************** */

  createMeeting: async (conversationId: string, type: 'VIDEO' | 'AUDIO') => {
    const response = await api.post('/chat/meetings', { conversationId, type });
    return response.data;
  },

  joinMeeting: async (meetingId: string) => {
    const response = await api.get(`/chat/meetings/${meetingId}/join`);
    return response.data; // Trả về { roomName: string, token: string }
  },

  endMeeting: async (meetingId: string) => {
    const response = await api.put(`/chat/meetings/${meetingId}/end`);
    return response.data;
  },

  getMeeting: async (meetingId: string) => {
    const response = await api.get(`/chat/meetings/${meetingId}`);
    return response.data;
  },


};