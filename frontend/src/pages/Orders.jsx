import { useEffect, useState } from 'react';
import * as ordersApi from '../services/orders.js';
import * as cancellationsApi from '../services/cancellations.js';
import { getErrorMessage } from '../services/api.js';
import { formatMoney } from '../utils/money.js';
import Spinner from '../components/Spinner.jsx';
import Alert from '../components/Alert.jsx';

const statusColors = {
  pending_payment: 'text-amber-400',
  paid: 'text-emerald-400',
  processing: 'text-sky-400',
  shipped: 'text-violet-400',
  delivered: 'text-slate-300',
  cancelled: 'text-red-400',
};

const CANCELABLE_ORDER_STATUSES = ['pending_payment', 'paid', 'processing'];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [result, setResult] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await ordersApi.listMyOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCancel = async (orderId) => {
    setErr('');
    setResult(null);
    setCancellingId(orderId);
    try {
      const data = await cancellationsApi.cancelOrder(orderId, false);
      setResult(
        data.refunded
          ? { type: 'success', message: `Order cancelled. Refund: ${data.refundAmount} (minor units) will be processed.` }
          : { type: 'info', message: 'Order cancelled.' }
      );
      await load();
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">My orders</h1>
      <p className="mt-1 text-sm text-slate-400">Cancel before shipping to get a refund (90% as buyer).</p>
      {err && (
        <div className="mt-4">
          <Alert onDismiss={() => setErr('')}>{err}</Alert>
        </div>
      )}
      {result && (
        <Alert type={result.type} onDismiss={() => setResult(null)} className="mt-4">
          {result.message}
        </Alert>
      )}
      <ul className="mt-8 space-y-4">
        {orders.length === 0 && <p className="text-slate-500">No orders yet.</p>}
        {orders.map((o) => {
          const canCancel = CANCELABLE_ORDER_STATUSES.includes(o.status);
          return (
            <li key={o.id} className="card border-ink-600">
              <div className="flex flex-wrap justify-between gap-2">
                <span className="font-medium text-white">{o.product?.name || 'Product'}</span>
                <span className={`text-sm font-medium capitalize ${statusColors[o.status] || ''}`}>{o.status?.replace('_', ' ')}</span>
              </div>
              <p className="mt-2 text-sm text-slate-400">
                Qty {o.quantity} ·{' '}
                {o.product && formatMoney(o.product.priceAmount * o.quantity, o.product.currency)}
              </p>
              <p className="text-xs text-slate-600 mt-1">Order #{o.id.slice(0, 8)}</p>
              {canCancel && (
                <button
                  type="button"
                  className="btn-secondary mt-3 text-sm"
                  onClick={() => handleCancel(o.id)}
                  disabled={cancellingId === o.id}
                >
                  {cancellingId === o.id ? 'Cancelling…' : 'Cancel order'}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
