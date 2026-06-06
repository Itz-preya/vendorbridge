'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Vendor { id: string; name: string; company: string; email: string; phone: string; gstNumber: string; category: string; status: string; address: string; }

const CATEGORIES = ['IT_SERVICES','MANUFACTURING','CONSULTING','LOGISTICS','RAW_MATERIALS','OFFICE_SUPPLIES'];
const CAT_LABELS: Record<string,string> = { IT_SERVICES:'IT Services', MANUFACTURING:'Manufacturing', CONSULTING:'Consulting', LOGISTICS:'Logistics', RAW_MATERIALS:'Raw Materials', OFFICE_SUPPLIES:'Office Supplies' };
const STATUS_BADGE: Record<string,string> = { ACTIVE:'badge-success', INACTIVE:'badge-neutral', BLACKLISTED:'badge-danger' };

const emptyForm = { name:'', company:'', email:'', phone:'', gstNumber:'', category:'IT_SERVICES', address:'' };

export default function VendorClient({ initial }: { initial: Vendor[] }) {
  const router = useRouter();
  const [vendors, setVendors] = useState(initial);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [serverErr, setServerErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string|null>(null);

  const refresh = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (catFilter) params.set('category', catFilter);
    if (statusFilter) params.set('status', statusFilter);
    const res = await fetch('/api/vendors?' + params);
    const data = await res.json();
    setVendors(data.vendors || []);
  }, [search, catFilter, statusFilter]);

  useEffect(() => { refresh(); }, [refresh]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setErrors({}); setServerErr(''); setModal(true); };
  const openEdit = (v: Vendor) => { setEditing(v); setForm({ name:v.name, company:v.company, email:v.email, phone:v.phone, gstNumber:v.gstNumber, category:v.category, address:v.address }); setErrors({}); setServerErr(''); setModal(true); };

  const validate = () => {
    const e: Record<string,string> = {};
    if (!form.name || form.name.length < 2) e.name = 'Required (min 2 chars)';
    if (!form.company || form.company.length < 2) e.company = 'Required (min 2 chars)';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    if (!form.phone) e.phone = 'Phone required';
    if (!form.gstNumber || !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(form.gstNumber)) e.gstNumber = 'Valid GST (e.g. 27AABCU9603R1ZM)';
    if (!form.address || form.address.length < 10) e.address = 'Address required (min 10 chars)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true); setServerErr('');
    try {
      const url = editing ? `/api/vendors/${editing.id}` : '/api/vendors';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setServerErr(data.error || 'Failed to save'); return; }
      setModal(false); router.refresh(); refresh();
    } catch { setServerErr('Network error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this vendor? This cannot be undone.')) return;
    setDeleteId(id);
    await fetch(`/api/vendors/${id}`, { method: 'DELETE' });
    setDeleteId(null); refresh();
  };

  return (
    <>
      <div className="search-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: '180px' }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
        </select>
        <select className="form-select" style={{ width: '150px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="BLACKLISTED">Blacklisted</option>
        </select>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Vendor</button>
      </div>

      {vendors.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏢</div>
          <div className="empty-state-title">No vendors found</div>
          <div className="empty-state-desc">Add your first vendor to get started</div>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Vendor</button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Company / Contact</th>
                <th>Email</th>
                <th>Phone</th>
                <th>GST Number</th>
                <th>Category</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map(v => (
                <tr key={v.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{v.company}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{v.name}</div>
                  </td>
                  <td className="text-sm">{v.email}</td>
                  <td className="text-sm">{v.phone}</td>
                  <td><code style={{ fontSize: '12px', color: 'var(--accent-blue)' }}>{v.gstNumber}</code></td>
                  <td><span className="badge badge-info">{CAT_LABELS[v.category]}</span></td>
                  <td><span className={`badge ${STATUS_BADGE[v.status] || 'badge-neutral'}`}>{v.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(v)}>✏️ Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(v.id)} disabled={deleteId === v.id}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editing ? '✏️ Edit Vendor' : '+ Add New Vendor'}</h2>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            {serverErr && <div className="alert alert-error">⚠ {serverErr}</div>}
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Contact Name</label>
                  <input className={`form-input ${errors.name ? 'error' : ''}`} placeholder="Ravi Kumar" value={form.name} onChange={e => setForm({...form, name:e.target.value})} />
                  {errors.name && <p className="form-error">⚠ {errors.name}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input className={`form-input ${errors.company ? 'error' : ''}`} placeholder="TechSolutions India Pvt Ltd" value={form.company} onChange={e => setForm({...form, company:e.target.value})} />
                  {errors.company && <p className="form-error">⚠ {errors.company}</p>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className={`form-input ${errors.email ? 'error' : ''}`} placeholder="vendor@company.in" value={form.email} onChange={e => setForm({...form, email:e.target.value})} />
                  {errors.email && <p className="form-error">⚠ {errors.email}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className={`form-input ${errors.phone ? 'error' : ''}`} placeholder="+91 9876543210" value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} />
                  {errors.phone && <p className="form-error">⚠ {errors.phone}</p>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">GST Number</label>
                  <input className={`form-input ${errors.gstNumber ? 'error' : ''}`} placeholder="27AABCU9603R1ZM" value={form.gstNumber} onChange={e => setForm({...form, gstNumber:e.target.value.toUpperCase()})} />
                  {errors.gstNumber && <p className="form-error">⚠ {errors.gstNumber}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={form.category} onChange={e => setForm({...form, category:e.target.value})}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea className={`form-input form-textarea ${errors.address ? 'error' : ''}`} placeholder="Full address with city and pincode" value={form.address} onChange={e => setForm({...form, address:e.target.value})} rows={2} />
                {errors.address && <p className="form-error">⚠ {errors.address}</p>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner" /> Saving...</> : editing ? '✓ Update Vendor' : '+ Add Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
