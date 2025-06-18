import { createApiClient } from '../lib/apiClient';

const notificationServiceApi = createApiClient(process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL || 'http://localhost:3009/api/v1');

export const sendNotification = async (notificationData: any) => {
  return notificationServiceApi.post('/send', notificationData);
};

export const getNotifications = async (userId: string) => {
  return notificationServiceApi.get(`/notifications/${userId}`);
};

export const markNotificationAsRead = async (notificationId: string) => {
  return notificationServiceApi.put(`/notifications/${notificationId}/read`, {});
}; 