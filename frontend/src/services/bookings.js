import { api } from './api.js';

export async function listMyBookings() {
  const { data } = await api.get('/bookings/me');
  return data.data;
}

export async function listMyGroupBookings() {
  const { data } = await api.get('/group-bookings/me');
  return data.data;
}
