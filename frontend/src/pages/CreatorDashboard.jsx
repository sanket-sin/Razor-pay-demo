import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { useCreatorProfile } from '../hooks/useCreatorProfile.js';
import * as creatorsApi from '../services/creators.js';
import { getErrorMessage } from '../services/api.js';
import Alert from '../components/Alert.jsx';

const BUSINESS_TYPES = [
  { value: 'proprietary', label: 'Sole proprietorship (proprietary)' },
  { value: 'individual', label: 'Individual' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'private_limited', label: 'Private limited' },
  { value: 'public_limited', label: 'Public limited' },
  { value: 'llp', label: 'LLP' },
  { value: 'trust', label: 'Trust' },
  { value: 'society', label: 'Society' },
  { value: 'section_8_company', label: 'Section 8 company' },
  { value: 'other', label: 'Other' },
];

function emptyConnectorForm() {
  return {
    phone: '',
    legalBusinessName: '',
    businessType: 'proprietary',
    contactName: '',
    customerFacingBusinessName: '',
    category: 'education',
    subcategory: 'e_learning',
    businessModel: 'Online coaching, sessions, and digital products.',
    registeredStreet1: '',
    registeredStreet2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'IN',
    pan: '',
    gst: '',
  };
}

export default function CreatorDashboard() {
  const user = useAuthStore((s) => s.user);
  const { creatorId } = useCreatorProfile();
  const [creator, setCreator] = useState(null);
  const [razorpayAccountId, setRazorpayAccountId] = useState('');
  const [saving, setSaving] = useState(false);
  const [creatingConnector, setCreatingConnector] = useState(false);
  const [connectorForm, setConnectorForm] = useState(emptyConnectorForm);
  const [err, setErr] = useState('');
  const [saved, setSaved] = useState(false);
  const [connectorSuccess, setConnectorSuccess] = useState('');

  useEffect(() => {
    if (user?.role !== 'creator') return;
    creatorsApi
      .getCreatorMe()
      .then((data) => {
        setCreator(data);
        setRazorpayAccountId(data?.razorpayLinkedAccountId || '');
        setConnectorForm((f) => ({
          ...f,
          legalBusinessName: data?.displayName || user?.name || f.legalBusinessName,
          contactName: user?.name || f.contactName,
        }));
      })
      .catch(() => {
        setConnectorForm((f) => ({
          ...f,
          legalBusinessName: user?.name || f.legalBusinessName,
          contactName: user?.name || f.contactName,
        }));
      });
  }, [user?.role, user?.name]);

  const handleSaveConnector = async (e) => {
    e.preventDefault();
    setErr('');
    setSaved(false);
    setSaving(true);
    try {
      const updated = await creatorsApi.updateCreatorMe({ razorpayLinkedAccountId: razorpayAccountId.trim() || null });
      setCreator(updated);
      setRazorpayAccountId(updated?.razorpayLinkedAccountId || '');
      setSaved(true);
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateConnector = async (e) => {
    e.preventDefault();
    setErr('');
    setConnectorSuccess('');
    setCreatingConnector(true);
    try {
      const payload = {
        phone: connectorForm.phone,
        legalBusinessName: connectorForm.legalBusinessName.trim(),
        businessType: connectorForm.businessType,
        contactName: connectorForm.contactName.trim(),
        customerFacingBusinessName: connectorForm.customerFacingBusinessName.trim() || undefined,
        category: connectorForm.category.trim(),
        subcategory: connectorForm.subcategory.trim(),
        businessModel: connectorForm.businessModel.trim() || undefined,
        registeredStreet1: connectorForm.registeredStreet1.trim(),
        registeredStreet2: connectorForm.registeredStreet2.trim() || undefined,
        city: connectorForm.city.trim(),
        state: connectorForm.state.trim(),
        postalCode: connectorForm.postalCode.trim(),
        country: connectorForm.country.trim().toUpperCase() || 'IN',
        pan: connectorForm.pan.trim().toUpperCase(),
        gst: connectorForm.gst.trim() || undefined,
      };
      const result = await creatorsApi.createRazorpayLinkedAccount(payload);
      setRazorpayAccountId(result.razorpayLinkedAccountId || '');
      setCreator((c) =>
        c ? { ...c, razorpayLinkedAccountId: result.razorpayLinkedAccountId } : c
      );
      setConnectorSuccess(
        `Connector created: ${result.razorpayLinkedAccountId}. ${result.message || ''}`.trim()
      );
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      setCreatingConnector(false);
    }
  };

  const hasLinkedAccount = Boolean(razorpayAccountId);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Creator dashboard</h1>
      <p className="mt-1 text-slate-400">Logged in as {user?.name}</p>
      {!creatorId && (
        <p className="mt-2 text-sm text-amber-400/90">
          Create your first session to link this dashboard to your creator profile.
        </p>
      )}

      {user?.role === 'creator' && (
        <div className="mt-8 card border-ink-600 max-w-3xl">
          <h2 className="font-display font-semibold text-white">Payment account (connector)</h2>
          <p className="mt-1 text-sm text-slate-400">
            Create a Razorpay Route linked account from here (uses your login email), or open the Razorpay dashboard to finish KYC, bank, and product configuration. Route must be enabled on your Razorpay merchant account.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <button
              type="button"
              className="btn-secondary"
              onClick={async () => {
                try {
                  const url = await creatorsApi.getRazorpayConnectUrl();
                  if (url) window.open(url, '_blank', 'noopener,noreferrer');
                  else setErr('Could not get Razorpay link.');
                } catch (e) {
                  setErr(getErrorMessage(e));
                }
              }}
            >
              Open Razorpay Route
            </button>
            <span className="text-slate-500 text-sm">Dashboard — stakeholders, bank, Route product config</span>
          </div>

          {!hasLinkedAccount && (
            <form onSubmit={handleCreateConnector} className="mt-6 space-y-4 border-t border-ink-600 pt-6">
              <h3 className="text-sm font-semibold text-white">Create connector account (API)</h3>
              <p className="text-xs text-slate-500">
                Uses Razorpay <code className="text-slate-400">POST /v2/accounts</code>. PAN and address must match Razorpay KYC rules. Test mode may still require valid-looking values.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-slate-400">
                  Business phone (8–15 digits)
                  <input
                    className="input mt-1 w-full"
                    required
                    value={connectorForm.phone}
                    onChange={(e) => setConnectorForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="9876543210"
                  />
                </label>
                <label className="block text-sm text-slate-400">
                  Legal business name (min 4 chars)
                  <input
                    className="input mt-1 w-full"
                    required
                    minLength={4}
                    value={connectorForm.legalBusinessName}
                    onChange={(e) => setConnectorForm((f) => ({ ...f, legalBusinessName: e.target.value }))}
                  />
                </label>
                <label className="block text-sm text-slate-400">
                  Business type
                  <select
                    className="input mt-1 w-full"
                    value={connectorForm.businessType}
                    onChange={(e) => setConnectorForm((f) => ({ ...f, businessType: e.target.value }))}
                  >
                    {BUSINESS_TYPES.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm text-slate-400">
                  Contact name (min 4 chars)
                  <input
                    className="input mt-1 w-full"
                    required
                    minLength={4}
                    value={connectorForm.contactName}
                    onChange={(e) => setConnectorForm((f) => ({ ...f, contactName: e.target.value }))}
                  />
                </label>
                <label className="block text-sm text-slate-400 sm:col-span-2">
                  Customer-facing name (optional)
                  <input
                    className="input mt-1 w-full"
                    value={connectorForm.customerFacingBusinessName}
                    onChange={(e) => setConnectorForm((f) => ({ ...f, customerFacingBusinessName: e.target.value }))}
                  />
                </label>
                <label className="block text-sm text-slate-400">
                  Category
                  <input
                    className="input mt-1 w-full"
                    value={connectorForm.category}
                    onChange={(e) => setConnectorForm((f) => ({ ...f, category: e.target.value }))}
                  />
                </label>
                <label className="block text-sm text-slate-400">
                  Subcategory
                  <input
                    className="input mt-1 w-full"
                    value={connectorForm.subcategory}
                    onChange={(e) => setConnectorForm((f) => ({ ...f, subcategory: e.target.value }))}
                  />
                </label>
                <label className="block text-sm text-slate-400 sm:col-span-2">
                  Business description (optional)
                  <input
                    className="input mt-1 w-full"
                    value={connectorForm.businessModel}
                    onChange={(e) => setConnectorForm((f) => ({ ...f, businessModel: e.target.value }))}
                  />
                </label>
                <label className="block text-sm text-slate-400 sm:col-span-2">
                  Registered address — line 1
                  <input
                    className="input mt-1 w-full"
                    required
                    value={connectorForm.registeredStreet1}
                    onChange={(e) => setConnectorForm((f) => ({ ...f, registeredStreet1: e.target.value }))}
                  />
                </label>
                <label className="block text-sm text-slate-400 sm:col-span-2">
                  Registered address — line 2 (optional)
                  <input
                    className="input mt-1 w-full"
                    value={connectorForm.registeredStreet2}
                    onChange={(e) => setConnectorForm((f) => ({ ...f, registeredStreet2: e.target.value }))}
                  />
                </label>
                <label className="block text-sm text-slate-400">
                  City
                  <input className="input mt-1 w-full" required value={connectorForm.city} onChange={(e) => setConnectorForm((f) => ({ ...f, city: e.target.value }))} />
                </label>
                <label className="block text-sm text-slate-400">
                  State
                  <input className="input mt-1 w-full" required value={connectorForm.state} onChange={(e) => setConnectorForm((f) => ({ ...f, state: e.target.value }))} />
                </label>
                <label className="block text-sm text-slate-400">
                  Postal code
                  <input className="input mt-1 w-full" required value={connectorForm.postalCode} onChange={(e) => setConnectorForm((f) => ({ ...f, postalCode: e.target.value }))} />
                </label>
                <label className="block text-sm text-slate-400">
                  Country (ISO-2)
                  <input
                    className="input mt-1 w-full"
                    maxLength={2}
                    value={connectorForm.country}
                    onChange={(e) => setConnectorForm((f) => ({ ...f, country: e.target.value.toUpperCase() }))}
                  />
                </label>
                <label className="block text-sm text-slate-400">
                  PAN (10 chars, e.g. ABCDE1234F)
                  <input
                    className="input mt-1 w-full"
                    required
                    maxLength={10}
                    value={connectorForm.pan}
                    onChange={(e) => setConnectorForm((f) => ({ ...f, pan: e.target.value.toUpperCase() }))}
                  />
                </label>
                <label className="block text-sm text-slate-400">
                  GST (optional)
                  <input className="input mt-1 w-full" value={connectorForm.gst} onChange={(e) => setConnectorForm((f) => ({ ...f, gst: e.target.value }))} />
                </label>
              </div>
              <button type="submit" className="btn-primary" disabled={creatingConnector}>
                {creatingConnector ? 'Creating…' : 'Create connector account'}
              </button>
            </form>
          )}

          {err && <Alert onDismiss={() => setErr('')} className="mt-3">{err}</Alert>}
          {connectorSuccess && (
            <Alert type="info" onDismiss={() => setConnectorSuccess('')} className="mt-3">
              {connectorSuccess}
            </Alert>
          )}
          {saved && <Alert type="info" onDismiss={() => setSaved(false)} className="mt-3">Saved.</Alert>}

          <div className="mt-6 border-t border-ink-600 pt-4">
            <p className="text-xs text-slate-500 mb-2">Linked account ID (edit manually if needed)</p>
            <form onSubmit={handleSaveConnector} className="flex flex-wrap gap-2 items-end">
              <input
                className="input flex-1 min-w-[200px]"
                placeholder="Razorpay linked account ID (e.g. acc_...)"
                value={razorpayAccountId}
                onChange={(e) => setRazorpayAccountId(e.target.value)}
              />
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/creator/session/new" className="card border-ink-600 hover:border-accent/40 transition">
          <h2 className="font-display font-semibold text-white">New 1:1 session</h2>
          <p className="mt-2 text-sm text-slate-400">Date, time window, slot length, price.</p>
        </Link>
        <Link to="/creator/group/new" className="card border-ink-600 hover:border-accent/40 transition">
          <h2 className="font-display font-semibold text-white">New group session</h2>
          <p className="mt-2 text-sm text-slate-400">Date range, daily hours, capacity.</p>
        </Link>
        <Link to="/creator/product/new" className="card border-ink-600 hover:border-accent/40 transition">
          <h2 className="font-display font-semibold text-white">New product</h2>
          <p className="mt-2 text-sm text-slate-400">Price, stock, delivery regions.</p>
        </Link>
        <Link to="/browse" className="card border-ink-600 hover:border-accent/40 transition">
          <h2 className="font-display font-semibold text-white">Sessions & shop (public)</h2>
          <p className="mt-2 text-sm text-slate-400">Preview how buyers see your listings and pay.</p>
        </Link>
      </div>
    </div>
  );
}
