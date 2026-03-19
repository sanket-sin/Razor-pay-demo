import { api } from './api.js';

export async function listProducts(params) {
  const { data } = await api.get('/products', { params });
  return data.data;
}

export async function createProduct(body) {
  const { data } = await api.post('/products', body);
  return data.data;
}
