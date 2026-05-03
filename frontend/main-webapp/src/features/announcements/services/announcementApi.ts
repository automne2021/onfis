import api from "../../../services/api";

export const announcementApi = {

  getById: async (id: string | number) => {
    const response = await api.get(`/announcements/detail/${id}`);
    return response.data;
  },

  getAll: async (page: number = 0, size: number = 10) => {
    const response = await api.get(`/announcements/all?page=${page}&size=${size}`);
    return response.data; 
  },

  getPinnedAnnouncements: async (page: number = 0, size: number = 10) => {
    const response = await api.get(`/announcements/pinned?page=${page}&size=${size}`);
    return response.data;
  },

  getCompanyAnnouncements: async (page: number = 0, size: number = 10) => {
    const response = await api.get(`/announcements/company?page=${page}&size=${size}`);
    return response.data;
  },

  getDepartmentAnnouncements: async (userId: string, page: number = 0, size: number = 10) => {
    const response = await api.get(`/announcements/department?page=${page}&size=${size}`, {
      headers: { 'X-User-ID': userId }
    });
    return response.data;
  },

  getMyDepartments: async () => {
    const response = await api.get('/announcements/my-departments');
    return response.data;
  },
  
  createAnnouncement: async (formData: FormData) => {
    const response = await api.post('/announcements/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  createComment: async (announcementId: string, content: string, parentId?: string | number | null) => {
    const payload = {
      content: content,
      parentId: parentId || null
    };
    const response = await api.post(`/announcements/${announcementId}/comments`, payload);
    return response.data;
  },

  toggleAnnouncementLike: async (announcementId: string | number) => {
    const response = await api.post(`/announcements/${announcementId}/like`);
    return response.data; // Trả về boolean (true/false)
  },

  toggleCommentLike: async (commentId: string | number) => {
    const response = await api.post(`/announcements/comments/${commentId}/like`);
    return response.data; // Trả về boolean (true/false)
  },

  searchAnnouncements: async (keyword: string, page: number = 0, size: number = 10) => {
    const response = await api.get(`/announcements/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`);
    return response.data;
  },

  getMyDraft: async () => {
    const response = await api.get('/announcements/draft');
    return response.data; 
  },

  toggleAnnouncementPin: async (announcementId: string | number) => {
    const response = await api.post(`/announcements/${announcementId}/toggle-pin`);
    return response.data; 
  },

  deleteAttachment: async (attachmentId: string | number) => {
    const response = await api.delete(`/announcements/attachments/${attachmentId}`);
    return response.data;
  },

  updateAnnouncement: async (id: string | number, formData: FormData) => {
    const response = await api.put(`/announcements/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteAnnouncement: async (id: string | number) => {
    const response = await api.delete(`/announcements/${id}`);
    return response.data;
  },
}