import { createApiClient } from '../lib/apiClient';

const authServiceApi = createApiClient(process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:3001/api/v1');

export const login = async (credentials: any) => {
  return authServiceApi.post('/login', credentials);
};

export const register = async (userData: any) => {
  return authServiceApi.post('/register', userData);
};

export const logout = async () => {
  return authServiceApi.post('/logout', {});
};

export const forgotPassword = async (email: string) => {
  return authServiceApi.post('/forgot-password', { email });
};

export const resetPassword = async (token: string, newPassword: string) => {
  return authServiceApi.post('/reset-password', { token, newPassword });
};

export const verifyEmail = async (token: string) => {
  return authServiceApi.get(`/verify-email/${token}`);
}; 