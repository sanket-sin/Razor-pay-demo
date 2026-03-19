import { api } from './api.js';

export async function verifyPayment(paymentId, options = {}) {
  const body = { paymentId };
  if (typeof options === 'string') {
    body.paymentIntentId = options;
  } else {
    const { paymentIntentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = options;
    if (paymentIntentId) body.paymentIntentId = paymentIntentId;
    if (razorpayOrderId) body.razorpayOrderId = razorpayOrderId;
    if (razorpayPaymentId) body.razorpayPaymentId = razorpayPaymentId;
    if (razorpaySignature) body.razorpaySignature = razorpaySignature;
  }
  const { data } = await api.post('/payments/verify', body);
  return data.data;
}

export async function capturePayment(paymentId) {
  const { data } = await api.post('/payments/capture', { paymentId });
  return data.data;
}

export async function createPaymentOrder(body) {
  const { data } = await api.post('/payments/create-order', body);
  return data.data;
}

export async function refundPayment(paymentId, amount, reason) {
  const { data } = await api.post('/payments/refund', { paymentId, amount, reason });
  return data.data;
}
