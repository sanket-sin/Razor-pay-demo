import * as cancellationService from '../services/cancellationService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const cancelSessionBooking = asyncHandler(async (req, res) => {
  const { bookingId, asCreator } = req.validated.body;
  const result = await cancellationService.cancelSlotBooking(
    bookingId,
    req.user.id,
    Boolean(asCreator)
  );
  res.json({ success: true, data: result });
});

export const cancelGroupBooking = asyncHandler(async (req, res) => {
  const { groupBookingId, asCreator } = req.validated.body;
  const result = await cancellationService.cancelGroupBooking(
    groupBookingId,
    req.user.id,
    Boolean(asCreator)
  );
  res.json({ success: true, data: result });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const { orderId, asCreator } = req.validated.body;
  const result = await cancellationService.cancelProductOrder(
    orderId,
    req.user.id,
    Boolean(asCreator)
  );
  res.json({ success: true, data: result });
});
