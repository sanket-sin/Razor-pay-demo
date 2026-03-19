import * as paymentFlow from '../services/paymentFlowService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createOrder = asyncHandler(async (req, res) => {
  const { provider, purpose, slotId, groupSessionId, productId, quantity, shippingAddress } =
    req.validated.body;
  const result = await paymentFlow.createPaymentOrder({
    userId: req.user.id,
    providerName: provider,
    purpose,
    slotId,
    groupSessionId,
    productId,
    quantity,
    shippingAddress,
  });
  res.status(201).json({ success: true, data: result });
});

export const verify = asyncHandler(async (req, res) => {
  const { paymentId, paymentIntentId } = req.validated.body;
  const result = await paymentFlow.verifyAndFulfillPayment({
    paymentId,
    paymentIntentId,
    userId: req.user.id,
  });
  res.json({ success: true, data: result });
});

export const refund = asyncHandler(async (req, res) => {
  const { paymentId, amount, reason } = req.validated.body;
  const result = await paymentFlow.refundPayment({
    paymentId,
    amountMinor: amount,
    reason,
    actorUserId: req.user.id,
  });
  res.json({ success: true, data: result });
});
