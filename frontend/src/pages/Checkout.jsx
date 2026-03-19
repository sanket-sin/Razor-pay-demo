import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import * as productsApi from '../services/products.js';
import * as ordersApi from '../services/orders.js';
import { getErrorMessage } from '../services/api.js';
import { useAuthStore } from '../store/authStore.js';
import { formatMoney } from '../utils/money.js';
import Spinner from '../components/Spinner.jsx';
import Alert from '../components/Alert.jsx';
import StripeCheckout from '../components/StripeCheckout.jsx';

export default function Checkout() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [addr, setAddr] = useState({ line1: '', city: '', region: '', postal: '' });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [pay, setPay] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const list = await productsApi.listProducts({});
        const p = list?.find((x) => x.id === productId);
        setProduct(p || null);
      } catch (e) {
        setErr(getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  const checkout = async () => {
    if (!token || user?.role !== 'buyer') {
      setErr('Log in as a buyer to purchase.');
      return;
    }
    setErr('');
    try {
      const shippingAddress = {
        line1: addr.line1,
        city: addr.city,
        region: addr.region,
        postal: addr.postal,
      };
      const res = await ordersApi.createOrder({
        productId,
        quantity: qty,
        shippingAddress,
        provider: 'stripe',
      });
      setPay({ clientSecret: res.clientSecret, paymentId: res.paymentId });
    } catch (e) {
      setErr(getErrorMessage(e));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }
  if (!product) {
    return (
      <div>
        <Alert>Product not found.</Alert>
        <Link to="/products" className="btn-secondary mt-4 inline-block">
          Back to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-2xl font-bold text-white">Checkout</h1>
      <div className="card mt-6 border-ink-600">
        <h2 className="font-semibold text-white">{product.name}</h2>
        <p className="text-accent mt-2">{formatMoney(product.priceAmount * qty, product.currency)}</p>
        <div className="mt-4">
          <label className="label">Quantity</label>
          <input
            type="number"
            min={1}
            max={product.stock}
            className="input w-24"
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(product.stock, Number(e.target.value) || 1)))}
          />
        </div>
        <div className="mt-4 space-y-2">
          <label className="label">Shipping</label>
          <input className="input" placeholder="Address line" value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <input className="input" placeholder="City" value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} />
            <input className="input" placeholder="Region" value={addr.region} onChange={(e) => setAddr({ ...addr, region: e.target.value })} />
          </div>
          <input className="input" placeholder="Postal code" value={addr.postal} onChange={(e) => setAddr({ ...addr, postal: e.target.value })} />
        </div>
        {err && (
          <div className="mt-4">
            <Alert>{err}</Alert>
          </div>
        )}
        {token && user?.role === 'buyer' ? (
          <button type="button" className="btn-primary mt-6 w-full" onClick={checkout}>
            Pay with card
          </button>
        ) : (
          <Link to="/login" className="btn-primary mt-6 block w-full text-center">
            Log in as buyer to pay
          </Link>
        )}
      </div>
      {pay && (
        <StripeCheckout
          clientSecret={pay.clientSecret}
          paymentId={pay.paymentId}
          onSuccess={() => {
            setPay(null);
            navigate('/orders');
          }}
          onClose={() => setPay(null)}
        />
      )}
    </div>
  );
}
