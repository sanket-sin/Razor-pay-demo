import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as productsApi from '../services/products.js';
import { getErrorMessage } from '../services/api.js';
import Alert from '../components/Alert.jsx';

export default function CreateProduct() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDesc] = useState('');
  const [priceAmount, setPrice] = useState(2500);
  const [currency, setCurrency] = useState('usd');
  const [stock, setStock] = useState(10);
  const [regions, setRegions] = useState('US,IN,*');
  const [imageUrl, setImage] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const deliveryRegions = regions
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (deliveryRegions.length === 0) deliveryRegions.push('*');
      await productsApi.createProduct({
        name,
        description,
        priceAmount: Number(priceAmount),
        currency,
        stock: Number(stock),
        deliveryRegions,
        imageUrl: imageUrl || undefined,
      });
      navigate('/products');
    } catch (er) {
      setErr(getErrorMessage(er));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-2xl font-bold text-white">New product</h1>
      <form onSubmit={submit} className="card mt-6 space-y-4 border-ink-600">
        {err && <Alert>{err}</Alert>}
        <div>
          <label className="label">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input min-h-[100px]" value={description} onChange={(e) => setDesc(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Price (minor units)</label>
            <input className="input" type="number" value={priceAmount} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <label className="label">Stock</label>
            <input className="input" type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Currency</label>
          <input className="input" maxLength={3} value={currency} onChange={(e) => setCurrency(e.target.value.toLowerCase())} />
        </div>
        <div>
          <label className="label">Delivery regions (comma codes, * = all)</label>
          <input className="input" value={regions} onChange={(e) => setRegions(e.target.value)} />
        </div>
        <div>
          <label className="label">Image URL (optional)</label>
          <input className="input" type="url" value={imageUrl} onChange={(e) => setImage(e.target.value)} placeholder="https://..." />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Saving…' : 'Create product'}
        </button>
      </form>
    </div>
  );
}
