import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import SessionsSection from '../components/browse/SessionsSection.jsx';
import ProductsSection from '../components/browse/ProductsSection.jsx';

export default function Browse() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const id = hash.replace(/^#/, '');
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [hash]);

  return (
    <div className="space-y-20">
      <header>
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Sessions & shop</h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Everything creators publish in one place — book a 1:1 slot or buy a product, then complete a one-time payment with
          Razorpay.
        </p>
      </header>
      <SessionsSection />
      <ProductsSection />
    </div>
  );
}
