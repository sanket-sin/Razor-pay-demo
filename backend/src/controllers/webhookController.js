import * as webhookService from '../services/webhookService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

export const stripe = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  if (!sig) throw AppError.badRequest('Missing stripe-signature');
  let event;
  try {
    event = webhookService.verifyStripeSignature(req.body, sig);
  } catch (e) {
    throw AppError.badRequest(`Webhook signature: ${e.message}`);
  }
  await webhookService.handleStripeEvent(event);
  res.json({ received: true });
});

export const razorpay = asyncHandler(async (req, res) => {
  await webhookService.handleRazorpayWebhook(req.body, req.headers['x-razorpay-signature']);
  res.json({ received: true });
});
