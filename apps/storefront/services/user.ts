import axios from '../lib/api';

const USER_SERVICE_URL = process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://localhost:3002/api/v1';

export const fetchUserProfile = async (userId: string) => {
  return axios.get(`${USER_SERVICE_URL}/users/${userId}/profile`);
};

export const updateUserProfile = async (userId: string, profileData: any) => {
  return axios.put(`${USER_SERVICE_URL}/users/${userId}/profile`, profileData);
};

export const changePassword = async (userId: string, passwordData: any) => {
  return axios.post(`${USER_SERVICE_URL}/users/${userId}/change-password`, passwordData);
};

export const deleteAccount = async (userId: string) => {
  return axios.delete(`${USER_SERVICE_URL}/users/${userId}`);
}; 