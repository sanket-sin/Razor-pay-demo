import { api } from './api.js';

export async function listGroupSessions(params) {
  const { data } = await api.get('/group-sessions', { params });
  return data.data;
}

export async function createGroupSession(body) {
  const { data } = await api.post('/group-sessions', body);
  return data.data;
}

export async function joinGroupSession(groupSessionId, provider = 'stripe') {
  const { data } = await api.post('/group-sessions/join', { groupSessionId, provider });
  return data.data;
}
