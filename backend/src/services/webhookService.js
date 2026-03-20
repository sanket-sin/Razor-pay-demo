import crypto from 'crypto';
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

export function verifyRazorpaySignature(rawBody, signature) {
  const secret = config.razorpay.webhookSecret;
  if (!secret) throw new Error('RAZORPAY_WEBHOOK_SECRET not set');
  const bodyStr = typeof rawBody === 'string' ? rawBody : Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : JSON.stringify(rawBody);
  const expected = crypto.createHmac('sha256', secret).update(bodyStr).digest('hex');
  if (expected !== signature) throw new Error('Razorpay webhook signature invalid');
}

export async function handleRazorpayWebhook(rawBody, signature) {
  if (!signature) throw new Error('Missing x-razorpay-signature');
  verifyRazorpaySignature(rawBody, signature);
  const body = typeof rawBody === 'string' ? JSON.parse(rawBody) : Buffer.isBuffer(rawBody) ? JSON.parse(rawBody.toString('utf8')) : rawBody;
  const event = body.event;

  switch (event) {
    case 'payment.captured': {
      const entity = body.payload?.payment?.entity;
      const orderId = entity?.order_id;
      const razorpayPaymentId = entity?.id;
      if (orderId && razorpayPaymentId) {
        const pay = await Payment.findOne({ where: { externalOrderId: orderId } });
        if (pay && pay.status !== 'captured') {
          try {
            await paymentFlow.fulfillPaymentFromWebhook(pay.id, razorpayPaymentId);
          } catch (e) {
            console.error('Razorpay webhook payment.captured error', e);
          }
        }
      }
      break;
    }
    case 'payment.failed': {
      const orderId = body.payload?.payment?.entity?.order_id;
      if (orderId) {
        const pay = await Payment.findOne({ where: { externalOrderId: orderId } });
        if (pay && pay.status === 'pending') {
          await paymentFlow.handlePaymentFailure(pay);
        }
      }
      break;
    }
    case 'payment.authorized': {
      const orderId = body.payload?.payment?.entity?.order_id;
      const razorpayPaymentId = body.payload?.payment?.entity?.id;
      if (orderId && razorpayPaymentId) {
        const pay = await Payment.findOne({ where: { externalOrderId: orderId } });
        if (pay && pay.status === 'pending') {
          await pay.update({ externalPaymentId: razorpayPaymentId });
        }
      }
      break;
    }
    case 'refund.created':
      break;
    default:
      break;
  }
  return { received: true };
}
