import { StripeService } from './stripeService.js';
import { RazorpayService } from './razorpayService.js';
import { config } from '../../config/index.js';

const stripe = new StripeService();
const razorpay = new RazorpayService();

export function getPaymentProvider(name) {
  const n = String(name || config.defaultPaymentProvider).toLowerCase();
  if (n === 'stripe') return stripe;
  if (n === 'razorpay') return razorpay;
  throw new Error(`Unknown payment provider: ${name}`);
}
