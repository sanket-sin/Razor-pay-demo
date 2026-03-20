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

  /** Create customer — POST /v1/customers (server-side only; never expose key_secret to the browser) */
  async createCustomer(ctx) {
    const { name, email, notes } = ctx;
    const client = this._client();
    log('POST /v1/customers');
    const payload = {
      name: String(name).trim().slice(0, 255),
      email: String(email).trim().toLowerCase(),
    };
    if (notes && typeof notes === 'object' && Object.keys(notes).length > 0) {
      payload.notes = Object.fromEntries(
        Object.entries(notes).map(([k, v]) => [String(k).slice(0, 255), String(v).slice(0, 256)])
      );
    }
    try {
      const customer = await client.customers.create(payload);
      return { customerId: customer.id, raw: customer };
    } catch (e) {
      const err = e?.error;
      const desc =
        (typeof err === 'object' && err?.description) ||
        (typeof err === 'string' ? err : null) ||
        e?.message ||
        'Razorpay customer creation failed';
      console.error('[RAZORPAY] createCustomer failed', e);
      throw AppError.badRequest(String(desc), { razorpay: err });
    }
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

  /**
   * Create Razorpay Route linked account (connector) — POST /v2/accounts
   * @see https://razorpay.com/docs/api/payments/route/create-linked-account/
   * After creation, creators may still need stakeholder + product config + bank in Razorpay Dashboard.
   */
  async createRouteLinkedAccount(ctx) {
    const {
      email,
      phone,
      legalBusinessName,
      businessType,
      contactName,
      customerFacingBusinessName,
      category,
      subcategory,
      businessModel,
      registeredStreet1,
      registeredStreet2,
      city,
      state,
      postalCode,
      country,
      pan,
      gst,
      referenceId,
    } = ctx;

    const client = this._client();
    const digits = String(phone).replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15) {
      throw AppError.badRequest('Phone must have 8–15 digits');
    }

    const profile = {
      category,
      subcategory,
      addresses: {
        registered: {
          street1: registeredStreet1.trim().slice(0, 255),
          street2: (registeredStreet2 && registeredStreet2.trim()) || '—',
          city: city.trim(),
          state: state.trim().toUpperCase(),
          postal_code: String(postalCode).trim(),
          country: (country || 'IN').toUpperCase(),
        },
      },
    };
    if (businessModel && String(businessModel).trim()) {
      profile.business_model = String(businessModel).trim().slice(0, 2000);
    }

    const legal_info = { pan: String(pan).trim().toUpperCase() };
    if (gst && String(gst).trim()) {
      legal_info.gst = String(gst).trim();
    }

    const ref = String(referenceId || '').slice(0, 512);
    if (ref.length < 3) {
      throw AppError.badRequest('reference_id must be at least 3 characters');
    }

    const payload = {
      email: email.trim().toLowerCase(),
      phone: digits,
      type: 'route',
      reference_id: ref,
      legal_business_name: legalBusinessName.trim(),
      business_type: businessType,
      contact_name: contactName.trim(),
      customer_facing_business_name: (customerFacingBusinessName || legalBusinessName).trim().slice(0, 255),
      profile,
      legal_info,
    };

    log('POST /v2/accounts', '(Route — create linked account)');
    try {
      const account = await client.accounts.create(payload);
      return { accountId: account.id, status: account.status, raw: account };
    } catch (e) {
      const err = e?.error;
      const desc =
        (typeof err === 'object' && err?.description) ||
        (typeof err === 'string' ? err : null) ||
        e?.message ||
        'Razorpay linked account creation failed';
      console.error('[RAZORPAY] createRouteLinkedAccount failed', e);
      throw AppError.badRequest(String(desc), { razorpay: err });
    }
  }
}
