import { Op } from 'sequelize';
import {
  sequelize,
  Session,
  Slot,
  Booking,
  Creator,
  User,
} from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { generateSlotIntervals, utcDayBoundsForSlot } from '../utils/dateSlots.js';
import { releaseExpiredSlotLocks, lockExpiryDate } from './slotLockService.js';

export async function createSession(creatorId, payload, options = {}) {
  const { transaction: outerTransaction } = options;
  const {
    title,
    sessionDate,
    sessionTz,
    windowStartMinute,
    windowEndMinute,
    slotDurationMinutes,
    priceAmount,
    currency,
  } = payload;

  if (windowEndMinute <= windowStartMinute) {
    throw AppError.badRequest('windowEndMinute must be greater than windowStartMinute');
  }
  if (slotDurationMinutes < 5 || slotDurationMinutes > 480) {
    throw AppError.badRequest('slotDurationMinutes must be between 5 and 480');
  }

  const intervals = generateSlotIntervals(
    sessionDate,
    sessionTz,
    windowStartMinute,
    windowEndMinute,
    slotDurationMinutes
  );
  if (intervals.length === 0) {
    throw AppError.badRequest('No slots generated for the given window');
  }

  const run = async (t) => {
    const session = await Session.create(
      {
        creatorId,
        title,
        sessionDate,
        sessionTz,
        windowStartMinute,
        windowEndMinute,
        slotDurationMinutes,
        priceAmount,
        currency: (currency || 'usd').toLowerCase(),
      },
      { transaction: t }
    );
    await Slot.bulkCreate(
      intervals.map((iv) => ({
        sessionId: session.id,
        startUtc: iv.startUtc,
        endUtc: iv.endUtc,
        status: 'available',
      })),
      { transaction: t }
    );
    return session;
  };

  if (outerTransaction) return run(outerTransaction);
  return sequelize.transaction(run);
}

export async function listSessions({ creatorId, fromDate, toDate }) {
  const where = { cancelledAt: null };
  if (creatorId) where.creatorId = creatorId;
  if (fromDate || toDate) {
    where.sessionDate = {};
    if (fromDate) where.sessionDate[Op.gte] = fromDate;
    if (toDate) where.sessionDate[Op.lte] = toDate;
  }
  return Session.findAll({
    where,
    include: [
      { model: Creator, as: 'creator', include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }] },
      { model: Slot, as: 'slots', required: false },
    ],
    order: [['sessionDate', 'ASC']],
  });
}

async function assertUserHasNoSlotThatDay(userId, slotStartUtc, transaction) {
  const { dayStart, dayEnd } = utcDayBoundsForSlot(slotStartUtc);
  const count = await Booking.count({
    where: {
      userId,
      status: { [Op.in]: ['pending_payment', 'confirmed'] },
    },
    include: [
      {
        model: Slot,
        as: 'slot',
        required: true,
        where: {
          startUtc: { [Op.between]: [dayStart, dayEnd] },
        },
      },
    ],
    transaction,
  });
  if (count > 0) {
    throw AppError.conflict('You can book only one individual session slot per calendar day (UTC)');
  }
}

/**
 * Lock slot + create pending booking (payment created in paymentService).
 * Used internally from payment flow.
 */
export async function lockSlotForUser(userId, slotId, transaction) {
  await releaseExpiredSlotLocks(transaction);

  const slot = await Slot.findByPk(slotId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
    include: [{ model: Session, as: 'session', required: true, where: { cancelledAt: null } }],
  });
  if (!slot) throw AppError.notFound('Slot not found');
  if (slot.status !== 'available') {
    throw AppError.conflict('Slot is not available');
  }

  await assertUserHasNoSlotThatDay(userId, slot.startUtc, transaction);

  const booking = await Booking.create(
    {
      userId,
      slotId,
      status: 'pending_payment',
    },
    { transaction }
  );

  await slot.update(
    {
      status: 'locked',
      lockExpiresAt: lockExpiryDate(),
    },
    { transaction }
  );

  return { booking, slot, session: slot.session };
}

export async function confirmSlotBooking(bookingId, paymentId, transaction) {
  const booking = await Booking.findByPk(bookingId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
    include: [{ model: Slot, as: 'slot' }],
  });
  if (!booking || booking.status !== 'pending_payment') {
    throw AppError.conflict('Invalid booking state');
  }
  await booking.update({ status: 'confirmed', paymentId }, { transaction });
  await booking.slot.update(
    { status: 'booked', lockExpiresAt: null },
    { transaction }
  );
}

export async function failSlotBooking(bookingId, transaction) {
  const booking = await Booking.findByPk(bookingId, {
    transaction,
    include: [{ model: Slot, as: 'slot' }],
  });
  if (!booking) return;
  if (booking.slot) {
    await booking.slot.update({ status: 'available', lockExpiresAt: null }, { transaction });
  }
  await booking.destroy({ transaction });
}

export async function getSessionById(id) {
  return Session.findByPk(id, {
    include: [{ model: Slot, as: 'slots' }],
  });
}
