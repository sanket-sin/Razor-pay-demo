import { Op } from 'sequelize';
import { sequelize, GroupSession, GroupBooking, Creator } from '../models/index.js';
import { AppError } from '../utils/AppError.js';

export async function createGroupSession(creatorId, payload) {
  const {
    title,
    startDate,
    endDate,
    sessionTz,
    dailyStartMinute,
    dailyEndMinute,
    maxParticipants,
    priceAmount,
    currency,
  } = payload;
  if (new Date(endDate) < new Date(startDate)) {
    throw AppError.badRequest('endDate must be >= startDate');
  }
  return GroupSession.create({
    creatorId,
    title,
    startDate,
    endDate,
    sessionTz: sessionTz || 'UTC',
    dailyStartMinute,
    dailyEndMinute,
    maxParticipants,
    priceAmount,
    currency: (currency || 'usd').toLowerCase(),
  });
}

async function countActiveBookings(groupSessionId, transaction) {
  return GroupBooking.count({
    where: {
      groupSessionId,
      status: { [Op.in]: ['pending_payment', 'confirmed'] },
    },
    transaction,
  });
}

export async function reserveGroupSeat(userId, groupSessionId, transaction) {
  const gs = await GroupSession.findOne({
    where: { id: groupSessionId, cancelledAt: null },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (!gs) throw AppError.notFound('Group session not found');

  const existing = await GroupBooking.findOne({
    where: { userId, groupSessionId },
    transaction,
  });
  if (existing && ['pending_payment', 'confirmed'].includes(existing.status)) {
    throw AppError.conflict('Already joined this group session');
  }

  const n = await countActiveBookings(groupSessionId, transaction);
  if (n >= gs.maxParticipants) {
    throw AppError.conflict('Group session is full');
  }

  let booking = existing;
  if (booking && booking.status !== 'pending_payment') {
    await booking.update({ status: 'pending_payment', cancelledAt: null, paymentId: null }, { transaction });
  } else if (!booking) {
    booking = await GroupBooking.create(
      { userId, groupSessionId, status: 'pending_payment' },
      { transaction }
    );
  }

  return { groupSession: gs, booking };
}

export async function confirmGroupBooking(bookingId, paymentId, transaction) {
  const b = await GroupBooking.findByPk(bookingId, { transaction, lock: transaction.LOCK.UPDATE });
  if (!b || b.status !== 'pending_payment') throw AppError.conflict('Invalid group booking');
  await b.update({ status: 'confirmed', paymentId }, { transaction });
}

export async function releaseGroupBooking(bookingId, transaction) {
  const b = await GroupBooking.findByPk(bookingId, { transaction });
  if (!b) return;
  await b.destroy({ transaction });
}

export async function listGroupSessions({ creatorId }) {
  const where = { cancelledAt: null };
  if (creatorId) where.creatorId = creatorId;
  return GroupSession.findAll({
    where,
    include: [{ model: Creator, as: 'creator' }],
    order: [['startDate', 'ASC']],
  });
}

export async function getGroupSessionWithCount(id) {
  const gs = await GroupSession.findByPk(id);
  if (!gs) return null;
  const booked = await GroupBooking.count({
    where: { groupSessionId: id, status: 'confirmed' },
  });
  const pending = await GroupBooking.count({
    where: { groupSessionId: id, status: 'pending_payment' },
  });
  return { ...gs.toJSON(), confirmedCount: booked, pendingCount: pending, spotsLeft: Math.max(0, gs.maxParticipants - booked - pending) };
}
