import { api } from './api.js';

export async function register(body) {
  const { data } = await api.post('/auth/register', body);
  return data.data;
}

export async function login(body) {
  const { data } = await api.post('/auth/login', body);
  return data.data;
}
