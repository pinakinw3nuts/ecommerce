import axios from '../lib/api';

const AUTH_SERVICE_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:3001/api/v1';

export const login = async (credentials: any) => {
  return axios.post(`${AUTH_SERVICE_URL}/login`, credentials);
};

export const register = async (userData: any) => {
  return axios.post(`${AUTH_SERVICE_URL}/register`, userData);
};

export const logout = async () => {
  return axios.post(`${AUTH_SERVICE_URL}/logout`, {});
};

export const forgotPassword = async (email: string) => {
  return axios.post(`${AUTH_SERVICE_URL}/forgot-password`, { email });
};

export const resetPassword = async (token: string, newPassword: string) => {
  return axios.post(`${AUTH_SERVICE_URL}/reset-password`, { token, newPassword });
};

export const verifyEmail = async (token: string) => {
  return axios.get(`${AUTH_SERVICE_URL}/verify-email/${token}`);
}; 