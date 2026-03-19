import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as productsApi from '../services/products.js';
import { getErrorMessage } from '../services/api.js';
import { formatMoney } from '../utils/money.js';
import Spinner from '../components/Spinner.jsx';
import Alert from '../components/Alert.jsx';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [region, setRegion] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr('');
      try {
        const data = await productsApi.listProducts(region ? { region } : {});
        setProducts(Array.isArray(data) ? data : []);
      } catch (e) {
        setErr(getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [region]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Shop</h1>
          <p className="mt-1 text-slate-400">Physical products from creators.</p>
        </div>
        <div>
          <label className="label">Filter region</label>
          <input
            className="input w-40"
            placeholder="e.g. US"
            value={region}
            onChange={(e) => setRegion(e.target.value.toUpperCase())}
          />
        </div>
      </div>
      {err && (
        <div className="mt-4">
          <Alert onDismiss={() => setErr('')}>{err}</Alert>
        </div>
      )}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.length === 0 && <p className="text-slate-500">No products match.</p>}
          {products.map((p) => (
            <Link key={p.id} to={`/checkout/${p.id}`} className="card border-ink-600 transition hover:border-accent/40">
              {p.imageUrl && (
                <img src={p.imageUrl} alt="" className="mb-4 h-40 w-full rounded-lg object-cover bg-ink-800" />
              )}
              <h2 className="font-semibold text-white">{p.name}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-slate-400">{p.description}</p>
              <p className="mt-3 text-accent font-medium">{formatMoney(p.priceAmount, p.currency)}</p>
              <p className="text-xs text-slate-500">Stock: {p.stock}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
