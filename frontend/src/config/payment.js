/** Must match backend DEFAULT_PAYMENT_PROVIDER for book-slot / orders. */
export function clientPaymentProvider() {
  const v = (import.meta.env.VITE_PAYMENT_PROVIDER || 'razorpay').toLowerCase();
  return v === 'stripe' ? 'stripe' : 'razorpay';
}
