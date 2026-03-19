import Stripe from 'stripe';
import { PaymentProvider } from './PaymentProvider.js';
import { AppError } from '../../utils/AppError.js';
import { config } from '../../config/index.js';

export class StripeService extends PaymentProvider {
  constructor(secretKey = config.stripe.secretKey) {
    super();
    this._stripe = secretKey ? new Stripe(secretKey) : null;
  }

  get name() {
    return 'stripe';
  }

  _client() {
    if (!this._stripe) throw AppError.badRequest('Stripe is not configured');
    return this._stripe;
  }

  async createOrder(ctx) {
    const { amountMinor, currency, metadata, paymentId, description } = ctx;
    const stripe = this._client();
    const pi = await stripe.paymentIntents.create({
      amount: amountMinor,
      currency: String(currency).toLowerCase(),
      metadata: { ...metadata, internal_payment_id: paymentId },
      description: description || 'Creator platform',
      automatic_payment_methods: { enabled: true },
    });
    return {
      externalOrderId: pi.id,
      externalClientSecret: pi.client_secret,
      raw: pi,
    };
  }

  async verifyPayment(ctx) {
    const { paymentIntentId } = ctx;
    const stripe = this._client();
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    const ok = pi.status === 'succeeded' || pi.status === 'processing';
    return { success: ok, status: pi.status, externalPaymentId: pi.latest_charge || pi.id, raw: pi };
  }

  async capturePayment(ctx) {
    const { paymentIntentId } = ctx;
    const stripe = this._client();
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.status === 'requires_capture') {
      await stripe.paymentIntents.capture(paymentIntentId);
    }
    return { captured: true };
  }

  async refund(ctx) {
    const { paymentIntentId, amountMinor, reason } = ctx;
    const stripe = this._client();
    const params = { payment_intent: paymentIntentId };
    if (amountMinor != null) params.amount = amountMinor;
    const ref = await stripe.refunds.create({ ...params, metadata: { reason: reason || '' } });
    return { externalRefundId: ref.id, amount: ref.amount, raw: ref };
  }

  async transferToCreator(ctx) {
    const { stripeConnectAccountId, amountMinor, currency, metadata } = ctx;
    if (!stripeConnectAccountId) {
      throw AppError.badRequest('Creator has no Stripe Connect account');
    }
    const stripe = this._client();
    const t = await stripe.transfers.create({
      amount: amountMinor,
      currency: String(currency).toLowerCase(),
      destination: stripeConnectAccountId,
      metadata: metadata || {},
    });
    return { transferId: t.id, raw: t };
  }
}
