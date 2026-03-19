import { PaymentProvider } from './PaymentProvider.js';
import { AppError } from '../../utils/AppError.js';

/**
 * Razorpay implementation is added in step 3 of the rollout.
 * This stub keeps the app bootable and routes testable before keys are set.
 */
export class RazorpayService extends PaymentProvider {
  get name() {
    return 'razorpay';
  }

  _notYet() {
    throw AppError.badRequest(
      'Razorpay provider: run project step 3 to enable (see docs/RAZORPAY.md)'
    );
  }

  async createOrder() {
    this._notYet();
  }
  async verifyPayment() {
    this._notYet();
  }
  async capturePayment() {
    this._notYet();
  }
  async refund() {
    this._notYet();
  }
  async transferToCreator() {
    this._notYet();
  }
}
