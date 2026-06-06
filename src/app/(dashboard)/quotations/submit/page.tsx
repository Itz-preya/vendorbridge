'use client';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface RFQ { id: string; rfqNumber: string; title: string; items: string; }
interface Vendor { id: string; company: string; }

function SubmitQuotationForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rfqId = searchParams.get('rfqId') || '';

  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [form, setForm] = useState({ rfqId, vendorId: '', deliveryTimeline: '', notes: '' });
  const [items, setItems] = useState<{name:string; quantity:number; unitPrice:number; totalPrice:number}[]>([]);
  const [saving, setSaving] = useState(false);
  const [serverErr, setServerErr] = useState('');
  const [errors, setErrors] = useState<Record<string,string>>({});

  const loadRfqItems = useCallback((rfq: RFQ) => {
    const parsed = JSON.parse(rfq.items);
    setItems(parsed.map((it: {name:string; quantity:number}) => ({ name: it.name, quantity: it.quantity, unitPrice: 0, totalPrice: 0 })));
    setForm(f => ({ ...f, rfqId: rfq.id }));
  }, []);

  useEffect(() => {
    fetch('/api/rfq?status=SENT').then(r => r.json()).then(d => {
      setRfqs(d.rfqs || []);
      if (rfqId) {
        const r = d.rfqs?.find((x: RFQ) => x.id === rfqId);
        if (r) loadRfqItems(r);
      }
    });
    fetch('/api/vendors?status=ACTIVE').then(r => r.json()).then(d => setVendors(d.vendors || []));
  }, [loadRfqItems, rfqId]);

  const updatePrice = (i: number, unitPrice: number) => {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, unitPrice, totalPrice: unitPrice * it.quantity } : it));
  };

  const totalAmount = items.reduce((s, it) => s + it.totalPrice, 0);

  const validate = () => {
    const e: Record<string,string> = {};
    if (!form.rfqId) e.rfq = 'Select an RFQ';
    if (!form.vendorId) e.vendor = 'Select your vendor profile';
    if (!form.deliveryTimeline) e.delivery = 'Delivery timeline is required';
    if (items.some(it => it.unitPrice <= 0)) e.items = 'All items must have a unit price';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true); setServerErr('');
    try {
      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, items, totalAmount }),
      });
      const data = await res.json();
      if (!res.ok) { setServerErr(data.error || 'Failed'); return; }
      router.push('/quotations');
    } catch { setServerErr('Network error'); }
    finally { setSaving(false); }
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="animate-fadeIn" style={{ maxWidth: '800px' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Submit Quotation</h1>
          <p className="page-subtitle">Provide your pricing for the requested items</p>
        </div>
      </div>

      {serverErr && <div className="alert alert-error">⚠ {serverErr}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div className="card mb-3">
          <div className="section-title">📋 Select RFQ</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Request for Quotation *</label>
              <select className={`form-select ${errors.rfq ? 'error' : ''}`} value={form.rfqId}
                onChange={e => { const r = rfqs.find(x => x.id === e.target.value); if (r) loadRfqItems(r); setForm({...form, rfqId: e.target.value}); }}>
                <option value="">— Select RFQ —</option>
                {rfqs.map(r => <option key={r.id} value={r.id}>{r.rfqNumber} · {r.title}</option>)}
              </select>
              {errors.rfq && <p className="form-error">⚠ {errors.rfq}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Your Vendor Profile *</label>
              <select className={`form-select ${errors.vendor ? 'error' : ''}`} value={form.vendorId} onChange={e => setForm({...form, vendorId: e.target.value})}>
                <option value="">— Select Vendor —</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.company}</option>)}
              </select>
              {errors.vendor && <p className="form-error">⚠ {errors.vendor}</p>}
            </div>
          </div>
        </div>

        {items.length > 0 && (
          <div className="card mb-3">
            <div className="section-title">💰 Item Pricing</div>
            {errors.items && <div className="alert alert-error mb-2">⚠ {errors.items}</div>}
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>Item</th><th>Qty</th><th>Unit Price (₹)</th><th>Total</th></tr></thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight:500 }}>{it.name}</td>
                      <td>{it.quantity}</td>
                      <td>
                        <input type="number" className="form-input" style={{ width:'140px' }} min={0} placeholder="0"
                          value={it.unitPrice || ''} onChange={e => updatePrice(i, parseFloat(e.target.value) || 0)} />
                      </td>
                      <td className="text-emerald font-semibold">{fmt(it.totalPrice)}</td>
                    </tr>
                  ))}
                  <tr style={{ background:'rgba(16,185,129,0.05)' }}>
                    <td colSpan={3} style={{ fontWeight:700, textAlign:'right' }}>Grand Total</td>
                    <td className="text-emerald font-bold" style={{ fontSize:'16px' }}>{fmt(totalAmount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="card mb-3">
          <div className="section-title">📝 Delivery Details</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Delivery Timeline *</label>
              <input className={`form-input ${errors.delivery ? 'error' : ''}`} placeholder="e.g. 15 working days from PO date" value={form.deliveryTimeline} onChange={e => setForm({...form, deliveryTimeline: e.target.value})} />
              {errors.delivery && <p className="form-error">⚠ {errors.delivery}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Additional Notes</label>
              <input className="form-input" placeholder="Warranty, payment terms, etc." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
            </div>
          </div>
        </div>

        <div style={{ display:'flex', gap:'12px', justifyContent:'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={() => router.push('/quotations')}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving || totalAmount === 0}>
            {saving ? <><span className="spinner" /> Submitting...</> : `📤 Submit Quotation · ${fmt(totalAmount)}`}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function SubmitQuotationPage() {
  return (
    <Suspense fallback={<div>Loading form...</div>}>
      <SubmitQuotationForm />
    </Suspense>
  );
}
