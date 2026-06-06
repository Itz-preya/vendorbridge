'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Vendor { id: string; company: string; name: string; category: string; }
interface Item { name: string; description: string; quantity: number; unit: string; }

const UNITS = ['pieces','kg','liters','meters','boxes','sets','units','hours','days','months'];
const CAT_LABELS: Record<string,string> = { IT_SERVICES:'IT Services', MANUFACTURING:'Manufacturing', CONSULTING:'Consulting', LOGISTICS:'Logistics', RAW_MATERIALS:'Raw Materials', OFFICE_SUPPLIES:'Office Supplies' };

export default function NewRFQPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [form, setForm] = useState({ title: '', description: '', deadline: '' });
  const [items, setItems] = useState<Item[]>([{ name: '', description: '', quantity: 1, unit: 'pieces' }]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [serverErr, setServerErr] = useState('');

  useEffect(() => {
    fetch('/api/vendors?status=ACTIVE').then(r => r.json()).then(d => setVendors(d.vendors || []));
  }, []);

  const addItem = () => setItems([...items, { name: '', description: '', quantity: 1, unit: 'pieces' }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof Item, value: string | number) => {
    setItems(items.map((it, idx) => idx === i ? { ...it, [field]: value } : it));
  };

  const toggleVendor = (id: string) => {
    setSelectedVendors(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title || form.title.length < 5) e.title = 'Title must be at least 5 characters';
    if (!form.description || form.description.length < 10) e.description = 'Description must be at least 10 characters';
    if (!form.deadline || new Date(form.deadline) <= new Date()) e.deadline = 'Deadline must be a future date';
    if (items.some(it => !it.name)) e.items = 'All items must have a name';
    if (selectedVendors.length === 0) e.vendors = 'Select at least one vendor';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true); setServerErr('');
    try {
      const res = await fetch('/api/rfq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, items, vendorIds: selectedVendors }),
      });
      const data = await res.json();
      if (!res.ok) { setServerErr(data.error || 'Failed to create RFQ'); return; }
      router.push('/rfq');
    } catch { setServerErr('Network error. Please try again.'); }
    finally { setSaving(false); }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="animate-fadeIn" style={{ maxWidth: '900px' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Create New RFQ</h1>
          <p className="page-subtitle">Send a Request for Quotation to vendors</p>
        </div>
      </div>

      {serverErr && <div className="alert alert-error">⚠ {serverErr}</div>}

      <form onSubmit={handleSubmit} noValidate>
        {/* Basic Info */}
        <div className="card mb-3">
          <div className="section-title">📋 RFQ Details</div>
          <div className="form-group">
            <label className="form-label">RFQ Title *</label>
            <input className={`form-input ${errors.title ? 'error' : ''}`} placeholder="e.g. Enterprise Software Development Services" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            {errors.title && <p className="form-error">⚠ {errors.title}</p>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea className={`form-input form-textarea ${errors.description ? 'error' : ''}`} placeholder="Describe what you need..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} />
              {errors.description && <p className="form-error">⚠ {errors.description}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Submission Deadline *</label>
              <input type="date" className={`form-input ${errors.deadline ? 'error' : ''}`} min={minDate} value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} />
              {errors.deadline && <p className="form-error">⚠ {errors.deadline}</p>}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="card mb-3">
          <div className="flex-between mb-2">
            <div className="section-title">📦 Required Items</div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>+ Add Item</button>
          </div>
          {errors.items && <div className="alert alert-error">⚠ {errors.items}</div>}
          {items.map((item, i) => (
            <div key={i} style={{ background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '16px', marginBottom: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                <div>
                  <label className="form-label">Item Name *</label>
                  <input className="form-input" placeholder="e.g. A4 Paper Reams" value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Quantity</label>
                  <input type="number" className="form-input" min={1} value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 1)} />
                </div>
                <div>
                  <label className="form-label">Unit</label>
                  <select className="form-select" value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={() => removeItem(i)} disabled={items.length === 1} style={{ marginBottom: '0' }}>🗑</button>
              </div>
              <div style={{ marginTop: '8px' }}>
                <input className="form-input" placeholder="Description / specifications (optional)" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} />
              </div>
            </div>
          ))}
        </div>

        {/* Vendor Selection */}
        <div className="card mb-3">
          <div className="section-title">🏢 Select Vendors *</div>
          {errors.vendors && <div className="alert alert-error mb-2">⚠ {errors.vendors}</div>}
          <p className="text-muted text-sm mb-2">{selectedVendors.length} vendor{selectedVendors.length !== 1 ? 's' : ''} selected</p>
          {vendors.length === 0 ? (
            <p className="text-muted">No active vendors. <a href="/vendors" style={{ color: 'var(--accent-emerald)' }}>Add vendors first →</a></p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {vendors.map(v => (
                <label key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: `1px solid ${selectedVendors.includes(v.id) ? 'var(--accent-emerald)' : 'var(--glass-border)'}`, background: selectedVendors.includes(v.id) ? 'var(--accent-emerald-glow)' : 'var(--glass)', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <input type="checkbox" checked={selectedVendors.includes(v.id)} onChange={() => toggleVendor(v.id)} style={{ accentColor: 'var(--accent-emerald)', width: '16px', height: '16px' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{v.company}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{CAT_LABELS[v.category] || v.category}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={() => router.push('/rfq')}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? <><span className="spinner" /> Creating RFQ...</> : '📤 Send RFQ to Vendors'}
          </button>
        </div>
      </form>
    </div>
  );
}
