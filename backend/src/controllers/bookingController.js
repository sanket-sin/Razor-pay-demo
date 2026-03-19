import { Booking, Slot, Session, Creator, GroupBooking, GroupSession } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listMyBookings = asyncHandler(async (req, res) => {
  const rows = await Booking.findAll({
    where: { userId: req.user.id },
    include: [
      {
        model: Slot,
        as: 'slot',
        include: [
          {
            model: Session,
            as: 'session',
            include: [{ model: Creator, as: 'creator' }],
          },
        ],
      },
    ],
    order: [['createdAt', 'DESC']],
  });
  res.json({ success: true, data: rows });
});

export const listMyGroupBookings = asyncHandler(async (req, res) => {
  const rows = await GroupBooking.findAll({
    where: { userId: req.user.id },
    include: [{ model: GroupSession, as: 'groupSession' }],
    order: [['createdAt', 'DESC']],
  });
  res.json({ success: true, data: rows });
});
