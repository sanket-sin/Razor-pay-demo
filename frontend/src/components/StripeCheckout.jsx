import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { verifyPayment } from '../services/payments.js';
import Spinner from './Spinner.jsx';

const pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

function InnerForm({ paymentId, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    onError('');
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });
      if (error) {
        onError(error.message || 'Payment failed');
        setBusy(false);
        return;
      }
      const piId = paymentIntent?.id;
      await verifyPayment(paymentId, piId);
      onSuccess();
    } catch (err) {
      onError(err.response?.data?.error?.message || err.message || 'Verification failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button type="submit" disabled={!stripe || busy} className="btn-primary w-full">
        {busy ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner className="h-5 w-5" /> Processing…
          </span>
        ) : (
          'Pay now'
        )}
      </button>
    </form>
  );
}

export default function StripeCheckout({ clientSecret, paymentId, onSuccess, onClose }) {
  const [error, setError] = useState('');
  const [stripePromise] = useState(() => (pk ? loadStripe(pk) : null));

  if (!pk) {
    return (
      <div className="card border-amber-500/30 text-amber-200 text-sm">
        Set <code className="text-amber-400">VITE_STRIPE_PUBLISHABLE_KEY</code> in{' '}
        <code>.env</code> to test card payments.
        <button type="button" className="btn-secondary mt-4 w-full" onClick={onClose}>
          Close
        </button>
      </div>
    );
  }

  if (!stripePromise || !clientSecret) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="card max-h-[90vh] w-full max-w-md overflow-y-auto border-ink-600">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Complete payment</h3>
          <button type="button" className="text-slate-400 hover:text-white" onClick={onClose}>
            ×
          </button>
        </div>
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <InnerForm paymentId={paymentId} onSuccess={onSuccess} onError={setError} />
        </Elements>
      </div>
    </div>
  );
}
