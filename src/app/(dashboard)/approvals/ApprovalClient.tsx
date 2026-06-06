'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Approval {
  id: string; status: string; remarks: string | null; createdAt: Date;
  quotation: { id: string; quotationNumber: string; totalAmount: number; deliveryTimeline: string;
    rfq: { rfqNumber: string; title: string }; vendor: { company: string } };
  approver: { name: string };
}

const BADGE: Record<string,string> = { PENDING:'badge-warning', APPROVED:'badge-success', REJECTED:'badge-danger' };
function fmt(n: number) { return new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(n); }
function fmtDate(d: Date) { return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }); }

export default function ApprovalClient({ approvals }: { approvals: Approval[] }) {
  const router = useRouter();
  const [modal, setModal] = useState(false);
  const [current, setCurrent] = useState<Approval | null>(null);
  const [action, setAction] = useState<'APPROVED'|'REJECTED'>('APPROVED');
  const [remarks, setRemarks] = useState('');
  const [remarksErr, setRemarksErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverErr, setServerErr] = useState('');

  const openModal = (a: Approval, act: 'APPROVED'|'REJECTED') => {
    setCurrent(a); setAction(act); setRemarks(''); setRemarksErr(''); setServerErr(''); setModal(true);
  };

  const handleSubmit = async () => {
    if (action === 'REJECTED' && (!remarks || remarks.length < 10)) { setRemarksErr('Reason must be at least 10 characters'); return; }
    if (!current) return;
    setLoading(true); setServerErr('');
    try {
      const res = await fetch(`/api/approvals/${current.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status: action, remarks }) });
      const data = await res.json();
      if (!res.ok) { setServerErr(data.error || 'Failed'); setLoading(false); return; }
      setModal(false); router.refresh();
    } catch { setServerErr('Network error'); }
    finally { setLoading(false); }
  };

  const pending = approvals.filter(a => a.status === 'PENDING');
  const done = approvals.filter(a => a.status !== 'PENDING');

  return (
    <>
      {pending.length > 0 && (
        <div className="mb-3">
          <div className="section-title mb-2">⏳ Pending Approvals ({pending.length})</div>
          {pending.map(a => (
            <div key={a.id} className="card mb-3" style={{ borderLeft: '3px solid var(--accent-amber)' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:'16px', alignItems:'start' }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'8px' }}>
                    <span style={{ fontWeight:700, fontSize:'16px' }}>{a.quotation.quotationNumber}</span>
                    <span className="badge badge-warning">PENDING APPROVAL</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'16px' }}>
                    {[
                      { label:'RFQ', value: a.quotation.rfq.rfqNumber },
                      { label:'Vendor', value: a.quotation.vendor.company },
                      { label:'Amount', value: fmt(a.quotation.totalAmount) },
                      { label:'Delivery', value: a.quotation.deliveryTimeline },
                    ].map(f => (
                      <div key={f.label}>
                        <div style={{ fontSize:'11px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.6px', color:'var(--text-muted)', marginBottom:'2px' }}>{f.label}</div>
                        <div style={{ fontSize:'14px', color: f.label==='Amount' ? 'var(--accent-emerald)' : 'var(--text-primary)', fontWeight: f.label==='Amount' ? 700 : 400 }}>{f.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize:'13px', color:'var(--text-muted)', marginTop:'8px' }}>
                    📋 {a.quotation.rfq.title} · Assigned to: {a.approver.name}
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'8px', minWidth:'160px' }}>
                  <button className="btn btn-primary" onClick={() => openModal(a, 'APPROVED')}>✓ Approve</button>
                  <button className="btn btn-danger" onClick={() => openModal(a, 'REJECTED')}>✕ Reject</button>
                  <Link href={`/quotations/${a.quotation.id}`} className="btn btn-secondary btn-sm">👁 View Details</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {done.length > 0 && (
        <div>
          <div className="section-title mb-2">✅ Processed Approvals ({done.length})</div>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Quotation</th><th>RFQ</th><th>Vendor</th><th>Amount</th><th>Status</th><th>Approver</th><th>Date</th></tr></thead>
              <tbody>
                {done.map(a => (
                  <tr key={a.id}>
                    <td><Link href={`/quotations/${a.quotation.id}`} style={{ color:'var(--accent-blue)', fontWeight:600 }}>{a.quotation.quotationNumber}</Link></td>
                    <td className="text-sm">{a.quotation.rfq.rfqNumber}</td>
                    <td className="text-sm">{a.quotation.vendor.company}</td>
                    <td className="text-emerald font-semibold">{fmt(a.quotation.totalAmount)}</td>
                    <td><span className={`badge ${BADGE[a.status]}`}>{a.status}</span></td>
                    <td className="text-sm">{a.approver.name}</td>
                    <td className="text-sm text-muted">{fmtDate(a.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {approvals.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <div className="empty-state-title">No approvals yet</div>
          <div className="empty-state-desc">Approval requests appear here when a quotation is selected</div>
        </div>
      )}

      {modal && current && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{action === 'APPROVED' ? '✓ Approve Quotation' : '✕ Reject Quotation'}</h2>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <div style={{ background:'var(--glass)', borderRadius:'var(--radius-sm)', padding:'16px', marginBottom:'20px' }}>
              <div style={{ fontWeight:600 }}>{current.quotation.quotationNumber}</div>
              <div style={{ fontSize:'13px', color:'var(--text-muted)' }}>{current.quotation.vendor.company} · {fmt(current.quotation.totalAmount)}</div>
            </div>
            {serverErr && <div className="alert alert-error mb-2">⚠ {serverErr}</div>}
            <div className="form-group">
              <label className="form-label">Remarks {action === 'REJECTED' ? '* (required)' : '(optional)'}</label>
              <textarea className={`form-input form-textarea ${remarksErr ? 'error' : ''}`} rows={3}
                placeholder={action === 'REJECTED' ? 'Provide reason for rejection (min 10 chars)...' : 'Optional comments...'}
                value={remarks} onChange={e => { setRemarks(e.target.value); setRemarksErr(''); }} />
              {remarksErr && <p className="form-error">⚠ {remarksErr}</p>}
            </div>
            {action === 'APPROVED' && (
              <div className="alert alert-success mb-2">✓ Approving will automatically generate a Purchase Order</div>
            )}
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className={`btn ${action === 'APPROVED' ? 'btn-primary' : 'btn-danger'}`} onClick={handleSubmit} disabled={loading}>
                {loading ? <><span className="spinner" /> Processing...</> : action === 'APPROVED' ? '✓ Confirm Approval' : '✕ Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
