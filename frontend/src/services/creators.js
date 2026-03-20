import { api } from './api.js';

export async function getCreatorMe() {
  const { data } = await api.get('/creators/me');
  return data.data;
}

export async function updateCreatorMe(body) {
  const { data } = await api.patch('/creators/me', body);
  return data.data;
}

/** URL to open for creator to create/link Razorpay Route (connector) account. */
export async function getRazorpayConnectUrl() {
  const { data } = await api.get('/creators/me/razorpay-connect-url');
  return data.data?.url;
}

/** Create Razorpay Route linked account (connector) via API; backend saves acc_… on your profile. */
export async function createRazorpayLinkedAccount(body) {
  const { data } = await api.post('/creators/me/razorpay-linked-account', body);
  return data.data;
}
