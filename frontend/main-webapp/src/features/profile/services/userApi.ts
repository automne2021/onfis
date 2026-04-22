// Import cái apiClient mà chúng ta vừa tạo, KHÔNG dùng axios gốc nữa

import api from "../../../services/api";
import type { FullUserProfile } from "../../../types/userType";

export const userApi = {
  getFullUserProfile: async (id: string): Promise<FullUserProfile> => {
    const response = await api.get(`/users/${id}/profile/detail`);
    return response.data;
  }
};