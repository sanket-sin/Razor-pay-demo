import { Op } from 'sequelize';
import { sequelize, Slot, Booking } from '../models/index.js';

const LOCK_MINUTES = 15;

export function lockExpiryDate() {
  return new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
}

/** Release expired locks and cancel orphan pending bookings */
export async function releaseExpiredSlotLocks(transaction) {
  const now = new Date();
  const locked = await Slot.findAll({
    where: { status: 'locked', lockExpiresAt: { [Op.lt]: now } },
    transaction,
    lock: transaction?.LOCK?.UPDATE,
  });

  for (const slot of locked) {
    await Booking.destroy({
      where: { slotId: slot.id, status: 'pending_payment' },
      transaction,
    });
    await slot.update({ status: 'available', lockExpiresAt: null }, { transaction });
  }
}

export { LOCK_MINUTES };
