import { useState, useEffect } from 'react';
import * as sessionsApi from '../services/sessions.js';
import * as ordersApi from '../services/orders.js';
import * as bookingsApi from '../services/bookings.js';
import * as paymentsApi from '../services/payments.js';
import * as cancellationsApi from '../services/cancellations.js';
import { getErrorMessage } from '../services/api.js';
import { useAuthStore } from '../store/authStore.js';
import Alert from '../components/Alert.jsx';
import RazorpayCheckout from '../components/RazorpayCheckout.jsx';

function CaseCard({ title, description, children }) {
  return (
    <div className="card border-ink-600 space-y-3">
      <div>
        <h3 className="font-semibold text-white">{title}</h3>
        {description && <p className="text-sm text-slate-400 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export default function PaymentTest() {
  const token = useAuthStore((s) => s.token);
  const [sessions, setSessions] = useState([]);
  const [err, setErr] = useState('');
  const [payState, setPayState] = useState(null);
  const [lastOrder, setLastOrder] = useState(null);
  const [result, setResult] = useState(null);

  // Shared inputs
  const [paymentId, setPaymentId] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [groupBookingId, setGroupBookingId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [asCreator, setAsCreator] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [myGroupBookings, setMyGroupBookings] = useState([]);
  const [myOrders, setMyOrders] = useState([]);

  const loadSessions = async () => {
    setErr('');
    try {
      const data = await sessionsApi.listSessions({});
      setSessions(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(getErrorMessage(e));
    }
  };

  const loadMyBookingsAndOrders = async () => {
    setErr('');
    try {
      const [bookings, groupBookings, orders] = await Promise.all([
        bookingsApi.listMyBookings(),
        bookingsApi.listMyGroupBookings(),
        ordersApi.listMyOrders(),
      ]);
      setMyBookings(Array.isArray(bookings) ? bookings : []);
      setMyGroupBookings(Array.isArray(groupBookings) ? groupBookings : []);
      setMyOrders(Array.isArray(orders) ? orders : []);
    } catch (e) {
      // non-blocking
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (token) loadMyBookingsAndOrders();
  }, [token]);

  const createOrderForSlot = async (slotId, freeze = false) => {
    if (!token) return;
    setErr('');
    setResult(null);
    try {
      const res = await paymentsApi.createPaymentOrder({
        provider: 'razorpay',
        purpose: 'slot',
        slotId,
        captureLater: freeze,
      });
      setLastOrder(res);
      if (res.provider === 'razorpay' && res.orderId && res.keyId) {
        setPayState({
          orderId: res.orderId,
          keyId: res.keyId,
          amount: res.amountTotal,
          currency: res.currency,
          paymentId: res.paymentId,
        });
      } else {
        setErr('Backend did not return Razorpay orderId/keyId. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
      }
    } catch (e) {
      setErr(getErrorMessage(e));
    }
  };

  const doRefund = async (full = true) => {
    if (!paymentId.trim()) {
      setErr('Enter payment ID (UUID)');
      return;
    }
    setErr('');
    setResult(null);
    try {
      const amount = full ? undefined : (refundAmount ? Number(refundAmount) : undefined);
      await paymentsApi.refundPayment(paymentId, amount, 'Test refund');
      setResult({ ok: true, message: full ? 'Full refund initiated' : `Partial refund (${refundAmount} minor units) initiated` });
    } catch (e) {
      setErr(getErrorMessage(e));
    }
  };

  const doCapture = async () => {
    if (!paymentId.trim()) {
      setErr('Enter payment ID');
      return;
    }
    setErr('');
    setResult(null);
    try {
      await paymentsApi.capturePayment(paymentId);
      setResult({ ok: true, message: 'Payment captured' });
    } catch (e) {
      setErr(getErrorMessage(e));
    }
  };

  const doCancelSession = async () => {
    if (!bookingId.trim()) {
      setErr('Enter booking ID');
      return;
    }
    setErr('');
    setResult(null);
    try {
      const data = await cancellationsApi.cancelSessionBooking(bookingId, asCreator);
      setResult({
        ok: true,
        refunded: data.refunded,
        refundAmount: data.refundAmount,
        message: data.refunded
          ? `Session booking cancelled. Refund: ${data.refundAmount} minor units (automatic per policy).`
          : (data.message || 'Booking cancelled. No refund per policy (e.g. less than 6h before start).'),
      });
      loadMyBookingsAndOrders();
    } catch (e) {
      setErr(getErrorMessage(e));
    }
  };

  const doCancelGroup = async () => {
    if (!groupBookingId.trim()) {
      setErr('Enter group booking ID');
      return;
    }
    setErr('');
    setResult(null);
    try {
      const data = await cancellationsApi.cancelGroupBooking(groupBookingId, asCreator);
      setResult({
        ok: true,
        refunded: data.refunded,
        refundAmount: data.refundAmount,
        message: data.refunded
          ? `Group booking cancelled. Refund: ${data.refundAmount} minor units (one participant, per policy).`
          : 'Group booking cancelled. No refund or already cancelled.',
      });
      loadMyBookingsAndOrders();
    } catch (e) {
      setErr(getErrorMessage(e));
    }
  };

  const doCancelOrder = async () => {
    if (!orderId.trim()) {
      setErr('Enter order ID');
      return;
    }
    setErr('');
    setResult(null);
    try {
      const data = await cancellationsApi.cancelOrder(orderId, asCreator);
      setResult({
        ok: true,
        refunded: data.refunded,
        refundAmount: data.refundAmount,
        message: data.refunded
          ? `Order cancelled. Refund: ${data.refundAmount} minor units (automatic per policy).`
          : 'Order cancelled. No refund or pending payment.',
      });
      loadMyBookingsAndOrders();
    } catch (e) {
      setErr(getErrorMessage(e));
    }
  };

  const formatSlot = (b) =>
    b.slot?.startUtc ? new Date(b.slot.startUtc).toLocaleString() : b.id?.slice(0, 8);
  const cancelableSessionBookings = myBookings.filter((b) => ['pending_payment', 'confirmed'].includes(b.status));
  const cancelableGroupBookings = myGroupBookings.filter((b) => ['pending_payment', 'confirmed'].includes(b.status));
  const cancelableOrders = myOrders.filter((o) => ['pending_payment', 'paid', 'processing'].includes(o.status));

  if (!token) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-2xl font-bold text-white">Payment test</h1>
        <Alert type="info" className="mt-4">
          <a href="/login" className="underline">Log in</a> to test payment cases.
        </Alert>
      </div>
    );
  }

  const slots = sessions.flatMap((s) =>
    (s.slots || []).filter((sl) => sl.status === 'available').map((sl) => ({ ...sl, session: s }))
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold text-white">Payment test</h1>
      <p className="text-slate-400 text-sm">
        Test refunds, cancel charges, and payment flows. Watch the backend for <code className="text-amber-400">[RAZORPAY]</code> logs.
      </p>
      <p className="text-amber-400/90 text-xs">
        If you see a Razorpay configuration error: add <code>RAZORPAY_KEY_ID</code> and <code>RAZORPAY_KEY_SECRET</code> to the backend <code>.env</code> (use test keys from Razorpay Dashboard → Settings → API Keys), then restart the backend.
      </p>

      {err && <Alert onDismiss={() => setErr('')}>{err}</Alert>}
      {result && (
        <Alert type={result.refunded ? 'success' : 'info'} onDismiss={() => setResult(null)}>
          {result.message}
        </Alert>
      )}

      {/* ——— Refunds: one person's cost ——— */}
      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-3">Refund (per person / per order)</h2>
        <div className="space-y-4">
          <CaseCard
            title="Refund 1:1 session"
            description="Refund one person's full session cost. Use the payment ID for that booking."
          >
            <div className="flex flex-wrap gap-2 items-end">
              <input
                className="input flex-1 min-w-[200px]"
                placeholder="Payment ID (UUID)"
                value={paymentId}
                onChange={(e) => setPaymentId(e.target.value)}
              />
              <button type="button" className="btn-primary" onClick={() => doRefund(true)}>
                Full refund
              </button>
            </div>
          </CaseCard>

          <CaseCard
            title="Refund group session (one participant)"
            description="Refund one participant's cost for a group session. Use the payment ID for that group booking."
          >
            <div className="flex flex-wrap gap-2 items-end">
              <input
                className="input flex-1 min-w-[200px]"
                placeholder="Payment ID (UUID)"
                value={paymentId}
                onChange={(e) => setPaymentId(e.target.value)}
              />
              <button type="button" className="btn-primary" onClick={() => doRefund(true)}>
                Refund one participant
              </button>
            </div>
          </CaseCard>

          <CaseCard
            title="Refund product order"
            description="Full or partial refund for a product order. Partial = enter amount in minor units."
          >
            <div className="flex flex-wrap gap-2 items-end">
              <input
                className="input w-48"
                placeholder="Payment ID"
                value={paymentId}
                onChange={(e) => setPaymentId(e.target.value)}
              />
              <input
                className="input w-28"
                type="number"
                placeholder="Amount (optional)"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
              />
              <button type="button" className="btn-secondary" onClick={() => doRefund(true)}>
                Full refund
              </button>
              <button type="button" className="btn-secondary" onClick={() => doRefund(false)}>
                Partial refund
              </button>
            </div>
          </CaseCard>
        </div>
      </section>

      {/* ——— Cancel charges ——— */}
      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-3">Cancel charges</h2>
        <div className="rounded bg-ink-900/60 px-3 py-2 text-xs text-slate-400 mb-4">
          Policy: 1:1 & group — full refund if cancelled ≥24h before start; 50% if ≥6h; else no refund. Creator cancel = full refund. Product — 90% refund (buyer); creator = 100%.
        </div>
        <div className="space-y-4">
          <CaseCard
            title="Cancel 1:1 session booking"
            description="Select a booking to cancel. Refund is automatic: full if ≥24h before start, 50% if ≥6h, else no refund."
          >
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 items-end">
                <div className="flex-1 min-w-[200px]">
                  <select
                    className="input w-full"
                    value={bookingId}
                    onChange={(e) => setBookingId(e.target.value)}
                  >
                    <option value="">Select your 1:1 booking…</option>
                    {cancelableSessionBookings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.slot?.session?.title || 'Session'} — {formatSlot(b)} — {b.status}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-400">
                  <input type="checkbox" checked={asCreator} onChange={(e) => setAsCreator(e.target.checked)} />
                  As creator (full refund)
                </label>
                <button type="button" className="btn-primary" onClick={doCancelSession}>
                  Cancel booking
                </button>
              </div>
              <input
                className="input max-w-xs text-xs"
                placeholder="Or paste booking ID"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
              />
            </div>
          </CaseCard>

          <CaseCard
            title="Cancel group session booking"
            description="Select a group booking to cancel. Refund = one participant's cost per policy."
          >
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 items-end">
                <div className="flex-1 min-w-[200px]">
                  <select
                    className="input w-full"
                    value={groupBookingId}
                    onChange={(e) => setGroupBookingId(e.target.value)}
                  >
                    <option value="">Select your group booking…</option>
                    {cancelableGroupBookings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.groupSession?.title || 'Group'} — {b.groupSession?.startDate} — {b.status}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-400">
                  <input type="checkbox" checked={asCreator} onChange={(e) => setAsCreator(e.target.checked)} />
                  As creator
                </label>
                <button type="button" className="btn-primary" onClick={doCancelGroup}>
                  Cancel group booking
                </button>
              </div>
              <input
                className="input max-w-xs text-xs"
                placeholder="Or paste group booking ID"
                value={groupBookingId}
                onChange={(e) => setGroupBookingId(e.target.value)}
              />
            </div>
          </CaseCard>

          <CaseCard
            title="Cancel product order"
            description="Select an order to cancel (before shipping). Refund: 90% buyer, 100% if as creator."
          >
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 items-end">
                <div className="flex-1 min-w-[200px]">
                  <select
                    className="input w-full"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                  >
                    <option value="">Select your order…</option>
                    {cancelableOrders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.product?.name || 'Product'} — {o.status} — Qty {o.quantity}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-400">
                  <input type="checkbox" checked={asCreator} onChange={(e) => setAsCreator(e.target.checked)} />
                  As creator
                </label>
                <button type="button" className="btn-primary" onClick={doCancelOrder}>
                  Cancel order
                </button>
              </div>
              <input
                className="input max-w-xs text-xs"
                placeholder="Or paste order ID"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              />
            </div>
          </CaseCard>
        </div>
      </section>

      {/* ——— Create payment & other ——— */}
      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-3">Create payment & other</h2>
        <div className="space-y-4">
          <CaseCard
            title="Create order (1:1 session) — normal"
            description="Create Razorpay order and open checkout. APIs: POST /v1/orders, verify, GET /v1/payments/:id."
          >
            <select
              className="input max-w-md"
              onChange={(e) => {
                const v = e.target.value;
                if (v) createOrderForSlot(v, false);
              }}
            >
              <option value="">Select slot…</option>
              {slots.slice(0, 20).map((sl) => (
                <option key={sl.id} value={sl.id}>
                  {sl.session?.title} — {sl.startUtc ? new Date(sl.startUtc).toLocaleString() : sl.id}
                </option>
              ))}
            </select>
          </CaseCard>

          <CaseCard
            title="Create order — freeze (capture later)"
            description="Order with payment_capture=0. After pay, capture via button below. APIs: POST /v1/orders (payment_capture=0), POST /v1/payments/:id/capture."
          >
            <select
              className="input max-w-md"
              onChange={(e) => {
                const v = e.target.value;
                if (v) createOrderForSlot(v, true);
              }}
            >
              <option value="">Select slot…</option>
              {slots.slice(0, 20).map((sl) => (
                <option key={sl.id} value={sl.id}>
                  {sl.session?.title} — {sl.startUtc ? new Date(sl.startUtc).toLocaleString() : sl.id}
                </option>
              ))}
            </select>
          </CaseCard>

          <CaseCard
            title="Manual capture (after freeze)"
            description="Capture an authorized payment. Enter payment ID from the freeze flow."
          >
            <div className="flex gap-2 flex-wrap">
              <input
                className="input flex-1 min-w-[200px]"
                placeholder="Payment ID (UUID)"
                value={paymentId}
                onChange={(e) => setPaymentId(e.target.value)}
              />
              <button type="button" className="btn-secondary" onClick={doCapture}>
                Capture payment
              </button>
            </div>
          </CaseCard>

          <CaseCard
            title="Platform fee & transfer"
            description="Fee breakdown from last created order. Transfer to creator uses POST /v1/transfers (Route)."
          >
            {lastOrder ? (
              <p className="text-sm text-slate-300">
                Total: {lastOrder.amountTotal} · Platform fee: {lastOrder.platformFee} · Creator: {lastOrder.creatorAmount} ({lastOrder.currency})
              </p>
            ) : (
              <p className="text-slate-500 text-sm">Create an order above to see breakdown.</p>
            )}
          </CaseCard>
        </div>
      </section>

      {payState && (
        <RazorpayCheckout
          orderId={payState.orderId}
          keyId={payState.keyId}
          amount={payState.amount}
          currency={payState.currency}
          paymentId={payState.paymentId}
          onSuccess={() => {
            setPayState(null);
            loadSessions();
          }}
          onClose={() => setPayState(null)}
          onError={(msg) => setErr(msg)}
        />
      )}
    </div>
  );
}
