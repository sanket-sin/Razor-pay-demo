import dotenv from 'dotenv';

dotenv.config();

const num = (v, d) => {
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : d;
};

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: num(process.env.PORT, 4000),
  apiBaseUrl: process.env.API_BASE_URL || `http://localhost:${num(process.env.PORT, 4000)}`,

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-only-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  platformFeeBps: num(process.env.PLATFORM_FEE_BPS, 1000),
  creatorPayoutDelayHours: num(process.env.CREATOR_PAYOUT_DELAY_HOURS, 48),
  sessionFullRefundHours: num(process.env.SESSION_FULL_REFUND_HOURS, 24),

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    defaultCurrency: process.env.STRIPE_DEFAULT_CURRENCY || 'usd',
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },

  defaultPaymentProvider: (process.env.DEFAULT_PAYMENT_PROVIDER || 'stripe').toLowerCase(),
};

export function assertProductionSecrets() {
  if (config.env === 'production') {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be set and >= 32 chars in production');
    }
  }
}
