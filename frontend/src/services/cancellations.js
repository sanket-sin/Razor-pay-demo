import { api } from './api.js';

export async function cancelSessionBooking(bookingId, asCreator = false) {
  const { data } = await api.post('/cancellations/session-booking', { bookingId, asCreator });
  return data.data;
}

export async function cancelGroupBooking(groupBookingId, asCreator = false) {
  const { data } = await api.post('/cancellations/group-booking', { groupBookingId, asCreator });
  return data.data;
}

export async function cancelOrder(orderId, asCreator = false) {
  const { data } = await api.post('/cancellations/order', { orderId, asCreator });
  return data.data;
}
