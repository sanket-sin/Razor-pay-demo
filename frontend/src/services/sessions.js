import { api } from './api.js';

export async function listSessions(params) {
  const { data } = await api.get('/sessions', { params });
  return data.data;
}

export async function createSession(body) {
  const { data } = await api.post('/sessions', body);
  return data.data;
}

export async function bookSlot(slotId, provider = 'stripe') {
  const { data } = await api.post('/sessions/book-slot', { slotId, provider });
  return data.data;
}
