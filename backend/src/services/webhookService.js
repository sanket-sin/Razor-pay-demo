import Stripe from 'stripe';
import { config } from '../config/index.js';
import { Payment } from '../models/index.js';
import * as paymentFlow from './paymentFlowService.js';

export function verifyStripeSignature(rawBody, signature) {
  const stripe = new Stripe(config.stripe.secretKey);
  return stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);
}

export async function handleStripeEvent(event) {
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object;
      const paymentId = pi.metadata?.internal_payment_id;
      if (paymentId) {
        try {
          await paymentFlow.verifyAndFulfillPayment({
            paymentId,
            paymentIntentId: pi.id,
          });
        } catch (e) {
          console.error('Stripe webhook fulfill error', e);
        }
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object;
      const paymentId = pi.metadata?.internal_payment_id;
      if (paymentId) {
        const pay = await Payment.findByPk(paymentId);
        if (pay && pay.status === 'pending') {
          await paymentFlow.handlePaymentFailure(pay);
        }
      }
      break;
    }
    default:
      break;
  }
}

/** Razorpay placeholder — implemented in step 3 */
export async function handleRazorpayWebhook(_body, _signature) {
  return { received: true };
}
