import crypto from 'crypto';
import Razorpay from 'razorpay';
import { PaymentProvider } from './PaymentProvider.js';
import { AppError } from '../../utils/AppError.js';
import { config } from '../../config/index.js';

const LOG_TAG = '[RAZORPAY]';

function log(api, detail = '') {
  console.log(`${LOG_TAG} ${api}${detail ? ` ${detail}` : ''}`);
}

export class RazorpayService extends PaymentProvider {
  constructor() {
    super();
    this._instance =
      config.razorpay.keyId && config.razorpay.keySecret
        ? new Razorpay({ key_id: config.razorpay.keyId, key_secret: config.razorpay.keySecret })
        : null;
  }

  get name() {
    return 'razorpay';
  }

  _client() {
    if (!this._instance) {
      throw AppError.badRequest(
        'Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend .env (get test keys from Razorpay Dashboard → Settings → API Keys).'
      );
    }
    return this._instance;
  }

  /** Create order — Razorpay Orders API (equivalent to Stripe PaymentIntent) */
  async createOrder(ctx) {
    const { amountMinor, currency, paymentId, description, metadata, captureLater } = ctx;
    const client = this._client();
    const receipt = String(paymentId).slice(0, 40);
    const options = {
      amount: Number(amountMinor),
      currency: String(currency).toUpperCase(),
      receipt,
      notes: metadata || {},
    };
    // Freeze payment: Capture Later (Stripe = Manual Capture)
    if (captureLater) {
      options.payment_capture = 0;
      log('POST /v1/orders', '(payment_capture=0 — Capture Later / Freeze)');
    } else {
      log('POST /v1/orders');
    }
    const order = await client.orders.create(options);
    return {
      externalOrderId: order.id,
      externalClientSecret: null,
      raw: order,
    };
  }

  /** Verify payment signature (order_id|payment_id signed with key_secret) */
  async verifyPayment(ctx) {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId } = ctx;
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw AppError.badRequest('Razorpay verify requires razorpayOrderId, razorpayPaymentId, razorpaySignature');
    }
    const secret = config.razorpay.keySecret;
    if (!secret) throw AppError.badRequest('Razorpay key secret not set');
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    const valid = expected === razorpaySignature;
    log('Verify signature', valid ? 'OK' : 'INVALID');
    if (!valid) throw AppError.badRequest('Razorpay signature verification failed');
    // Fetch payment status
    const client = this._client();
    log('GET /v1/payments/:id');
    const payment = await client.payments.fetch(razorpayPaymentId);
    const captured = payment.status === 'captured';
    const authorized = payment.status === 'authorized';
    const success = captured || authorized;
    return {
      success: Boolean(success),
      status: payment.status,
      externalPaymentId: razorpayPaymentId,
      needsCapture: authorized,
      raw: payment,
    };
  }

  /** Capture authorized payment (Stripe manual capture ↔ Razorpay Capture Later) */
  async capturePayment(ctx) {
    const { externalPaymentId } = ctx;
    const paymentId = externalPaymentId || ctx.paymentIntentId;
    if (!paymentId) throw AppError.badRequest('Payment id required for capture');
    const client = this._client();
    log('POST /v1/payments/:id/capture');
    const payment = await client.payments.fetch(paymentId);
    if (payment.status === 'captured') {
      return { captured: true, already: true };
    }
    if (payment.status !== 'authorized') {
      throw AppError.badRequest(`Razorpay payment not in authorized state: ${payment.status}`);
    }
    await client.payments.capture(paymentId, payment.amount);
    return { captured: true };
  }

  /** Full or partial refund — Razorpay Refund API */
  async refund(ctx) {
    const { externalPaymentId, amountMinor, reason } = ctx;
    const paymentId = externalPaymentId || ctx.paymentIntentId;
    if (!paymentId) throw AppError.badRequest('Payment id required for refund');
    const client = this._client();
    const params = { notes: { reason: reason || 'api_refund' } };
    if (amountMinor != null && amountMinor > 0) {
      params.amount = Number(amountMinor);
      log('POST /v1/payments/:id/refund', `(partial: ${amountMinor})`);
    } else {
      log('POST /v1/payments/:id/refund', '(full)');
    }
    const ref = await client.payments.refund(paymentId, params);
    return { externalRefundId: ref.id, amount: ref.amount, raw: ref };
  }

  /** Transfer to creator — Razorpay Route (equivalent to Stripe Connect / Transfers) */
  async transferToCreator(ctx) {
    const { razorpayLinkedAccountId, amountMinor, currency, metadata, sourcePaymentId } = ctx;
    if (!razorpayLinkedAccountId) {
      throw AppError.badRequest('Creator has no Razorpay linked account (Route)');
    }
    const client = this._client();
    const payload = {
      account: razorpayLinkedAccountId,
      amount: Number(amountMinor),
      currency: String(currency).toUpperCase(),
      notes: metadata || {},
    };
    if (sourcePaymentId) payload.payment_id = sourcePaymentId;
    log('POST /v1/transfers', '(Route — split to creator)');
    const transfer = await client.transfers.create(payload);
    return { transferId: transfer.id, raw: transfer };
  }
}
