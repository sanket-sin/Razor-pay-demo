import { api } from './api.js';

export async function verifyPayment(paymentId, paymentIntentId) {
  const { data } = await api.post('/payments/verify', { paymentId, paymentIntentId });
  return data.data;
}
