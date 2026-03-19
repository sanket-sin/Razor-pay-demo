import { useEffect, useRef, useState } from 'react';
import { verifyPayment } from '../services/payments.js';

const SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

export default function RazorpayCheckout({
  orderId,
  keyId,
  amount,
  currency,
  paymentId,
  onSuccess,
  onClose,
  onError,
}) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const opened = useRef(false);

  useEffect(() => {
    if (!orderId || !keyId || opened.current) return;
    let script = document.querySelector(`script[src="${SCRIPT_URL}"]`);
    const openCheckout = () => {
      if (!window.Razorpay) {
        setErr('Razorpay script failed to load');
        setLoading(false);
        return;
      }
      opened.current = true;
      setLoading(false);
      const options = {
        key: keyId,
        amount,
        currency: (currency || 'INR').toUpperCase(),
        order_id: orderId,
        name: 'Creator Platform',
        handler: async (res) => {
          try {
            await verifyPayment(paymentId, {
              razorpayOrderId: res.razorpay_order_id,
              razorpayPaymentId: res.razorpay_payment_id,
              razorpaySignature: res.razorpay_signature,
            });
            onSuccess?.();
          } catch (e) {
            onError?.(e?.response?.data?.error?.message || e.message);
          }
        },
        modal: { ondismiss: () => onClose?.() },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    };
    if (script) {
      openCheckout();
      return;
    }
    script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = openCheckout;
    script.onerror = () => {
      setErr('Failed to load Razorpay');
      setLoading(false);
    };
    document.body.appendChild(script);
    return () => {};
  }, [orderId, keyId, amount, currency, paymentId, onSuccess, onClose, onError]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="card max-w-md border-ink-600">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Razorpay Checkout</h3>
          <button type="button" className="text-slate-400 hover:text-white" onClick={onClose}>
            ×
          </button>
        </div>
        {loading && <p className="text-slate-400">Opening Razorpay…</p>}
        {err && (
          <div className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            {err}
          </div>
        )}
        {!loading && !err && (
          <p className="text-sm text-slate-400">If the popup was blocked, allow it and try again.</p>
        )}
      </div>
    </div>
  );
}
