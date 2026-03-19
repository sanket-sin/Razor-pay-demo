export function formatMoney(minor, currency = 'usd') {
  const c = (currency || 'usd').toUpperCase();
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: c.length === 3 ? c : 'USD',
    }).format(minor / 100);
  } catch {
    return `${(minor / 100).toFixed(2)} ${c}`;
  }
}

export function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISODate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
