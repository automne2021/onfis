import api from "../../../services/api";

export const announcementApi = {
  uploadStandaloneFile: async (formData: FormData) => {
    const response = await api.post('/announcements/attachments/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data; 
  },
};