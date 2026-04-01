import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const profileAPI = {
  getProfile: async () => {
    const response = await axios.get(`${API_URL}/profile`);
    return response.data;
  },

  updateProfile: async (profileData: any) => {
    const response = await axios.put(`${API_URL}/profile`, profileData);
    return response.data;
  },

  updateAvatar: async (avatarId: string) => {
    const response = await axios.put(`${API_URL}/profile/avatar`, { avatar: avatarId });
    return response.data;
  },

  searchUsers: async (query: string) => {
    const response = await axios.get(`${API_URL}/profile/search`, {
      params: { query }
    });
    return response.data;
  },

  getUserProfile: async (identifier: string) => {
    const response = await axios.get(`${API_URL}/profile/${identifier}`);
    return response.data;
  }
};
