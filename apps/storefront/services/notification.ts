import axios from '../lib/api';

const NOTIFICATION_SERVICE_URL = process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL || 'http://localhost:3009/api/v1';

export const sendNotification = async (notificationData: any) => {
  return axios.post(`${NOTIFICATION_SERVICE_URL}/send`, notificationData);
};

export const getNotifications = async (userId: string) => {
  return axios.get(`${NOTIFICATION_SERVICE_URL}/notifications/${userId}`);
};

export const markNotificationAsRead = async (notificationId: string) => {
  return axios.put(`${NOTIFICATION_SERVICE_URL}/notifications/${notificationId}/read`, {});
}; 