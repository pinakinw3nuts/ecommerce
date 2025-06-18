import { createApiClient } from '../lib/apiClient';

const paymentServiceApi = createApiClient(process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL || 'http://localhost:3007/api/v1');

export const createPaymentIntent = async (paymentData: any) => {
  return paymentServiceApi.post('/payment-intents', paymentData);
};

export const confirmPayment = async (paymentIntentId: string, confirmationData: any) => {
  return paymentServiceApi.post(`/payment-intents/${paymentIntentId}/confirm`, confirmationData);
};

export const getPaymentStatus = async (paymentIntentId: string) => {
  return paymentServiceApi.get(`/payment-intents/${paymentIntentId}/status`);
};

export const refundPayment = async (paymentId: string, refundAmount: number) => {
  return paymentServiceApi.post(`/payments/${paymentId}/refund`, { amount: refundAmount });
}; 