/**
 * Payment provider abstraction.
 * All amounts in minor units (cents/paise) unless noted.
 */

export class PaymentProvider {
  get name() {
    throw new Error('Not implemented');
  }

  /** Create server-side order / PaymentIntent before client confirms payment */
  async createOrder(ctx) {
    throw new Error('Not implemented');
  }

  /** Validate client callback / signature after payment attempt */
  async verifyPayment(ctx) {
    throw new Error('Not implemented');
  }

  /** Capture authorized funds (no-op if already captured) */
  async capturePayment(ctx) {
    throw new Error('Not implemented');
  }

  /** Full or partial refund */
  async refund(ctx) {
    throw new Error('Not implemented');
  }

  /** Payout to creator (Connect / linked account) */
  async transferToCreator(ctx) {
    throw new Error('Not implemented');
  }
}
