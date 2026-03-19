import { api } from './api.js';

export async function createOrder(body) {
  const { data } = await api.post('/orders', body);
  return data.data;
}

export async function listMyOrders() {
  const { data } = await api.get('/orders/me');
  return data.data;
}
