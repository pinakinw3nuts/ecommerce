import { createApiClient } from '../lib/apiClient';

const userServiceApi = createApiClient(process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://localhost:3002/api/v1');

export const fetchUserProfile = async (userId: string) => {
  return userServiceApi.get(`/users/${userId}/profile`);
};

export const updateUserProfile = async (userId: string, profileData: any) => {
  return userServiceApi.put(`/users/${userId}/profile`, profileData);
};

export const changePassword = async (userId: string, passwordData: any) => {
  return userServiceApi.post(`/users/${userId}/change-password`, passwordData);
};

export const deleteAccount = async (userId: string) => {
  return userServiceApi.delete(`/users/${userId}`);
}; 