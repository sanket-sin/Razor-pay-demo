import { api } from './api.js';

export async function getCreatorMe() {
  const { data } = await api.get('/creators/me');
  return data.data;
}

export async function updateCreatorMe(body) {
  const { data } = await api.patch('/creators/me', body);
  return data.data;
}
