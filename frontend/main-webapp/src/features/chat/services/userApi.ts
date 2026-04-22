import api from "../../../services/api";

export const userApi = {
  getProfile: async (userId: string) => {
    const response = await api.get(`/users/${userId}/profile`);
    return response.data;
  },

  getFullProfile: async (userId: string) => {
    const response = await api.get(`/users/${userId}/profile/detail`);
    return response.data;
  },

  searchUsers: async (keyword: string) => {
    const response = await api.get(`/users/search?q=${keyword}`);
    return response.data; 
  },
};