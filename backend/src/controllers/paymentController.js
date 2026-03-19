import * as paymentFlow from '../services/paymentFlowService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createOrder = asyncHandler(async (req, res) => {
  const { provider, purpose, slotId, groupSessionId, productId, quantity, shippingAddress, captureLater } =
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
    captureLater: captureLater === true,
  });
  res.status(201).json({ success: true, data: result });
});

export const verify = asyncHandler(async (req, res) => {
  const { paymentId, paymentIntentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.validated.body;
  const result = await paymentFlow.verifyAndFulfillPayment({
    paymentId,
    paymentIntentId,
    userId: req.user.id,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });
  res.json({ success: true, data: result });
});

export const capture = asyncHandler(async (req, res) => {
  const result = await paymentFlow.capturePayment(req.validated.body.paymentId, req.user.id);
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
