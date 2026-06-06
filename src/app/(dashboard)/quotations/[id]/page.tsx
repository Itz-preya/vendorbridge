import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import QuotationActions from './QuotationActions';

const BADGE: Record<string,string> = { SUBMITTED:'badge-info', UNDER_REVIEW:'badge-warning', ACCEPTED:'badge-success', REJECTED:'badge-danger' };
function fmt(n: number) { return new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(n); }
function fmtDate(d: Date) { return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }); }

export default async function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const q = await prisma.quotation.findUnique({
    where: { id },
    include: { rfq: { include: { rfqVendors: { include: { vendor: { select: { company:true } } } } } }, vendor: true, approvals: { include: { approver: { select: { name:true } } } } },
  });
  if (!q) notFound();
  const items = JSON.parse(q.items) as { name:string; quantity:number; unitPrice:number; totalPrice:number }[];

  return (
    <div className="animate-fadeIn" style={{ maxWidth:'900px' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{q.quotationNumber}</h1>
          <p className="page-subtitle">For {q.rfq.rfqNumber} · {q.rfq.title}</p>
        </div>
        <div className="page-actions">
          <span className={`badge ${BADGE[q.status] || 'badge-neutral'}`} style={{ fontSize:'14px', padding:'6px 16px' }}>{q.status}</span>
          <Link href="/quotations" className="btn btn-secondary">← Back</Link>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'24px' }}>
        <div>
          <div className="card mb-3">
            <div className="section-title">📋 Quotation Details</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>
              {[
                { label:'Vendor', value: q.vendor.company },
                { label:'Submitted On', value: fmtDate(q.createdAt) },
                { label:'Delivery Timeline', value: q.deliveryTimeline },
                { label:'Total Amount', value: fmt(q.totalAmount) },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ fontSize:'11px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.6px', color:'var(--text-muted)', marginBottom:'4px' }}>{f.label}</div>
                  <div style={{ fontSize:'14px', color: f.label==='Total Amount' ? 'var(--accent-emerald)' : 'var(--text-primary)', fontWeight: f.label==='Total Amount' ? 700 : 400 }}>{f.value}</div>
                </div>
              ))}
            </div>
            {q.notes && <div style={{ background:'var(--glass)', borderRadius:'var(--radius-sm)', padding:'12px', fontSize:'14px', color:'var(--text-secondary)' }}>📝 {q.notes}</div>}
          </div>

          <div className="card mb-3">
            <div className="section-title">💰 Item Pricing</div>
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight:500 }}>{it.name}</td>
                      <td>{it.quantity}</td>
                      <td>{fmt(it.unitPrice)}</td>
                      <td className="text-emerald font-semibold">{fmt(it.totalPrice)}</td>
                    </tr>
                  ))}
                  <tr style={{ background:'rgba(16,185,129,0.05)' }}>
                    <td colSpan={3} style={{ fontWeight:700, textAlign:'right' }}>Grand Total</td>
                    <td className="text-emerald" style={{ fontSize:'16px', fontWeight:800 }}>{fmt(q.totalAmount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {q.approvals.length > 0 && (
            <div className="card">
              <div className="section-title">✅ Approval History</div>
              {q.approvals.map(a => (
                <div key={a.id} style={{ padding:'12px', background:'var(--glass)', borderRadius:'var(--radius-sm)', marginBottom:'8px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontWeight:600 }}>{a.approver.name}</span>
                    <span className={`badge ${a.status==='APPROVED' ? 'badge-success' : a.status==='REJECTED' ? 'badge-danger' : 'badge-warning'}`}>{a.status}</span>
                  </div>
                  {a.remarks && <p style={{ fontSize:'13px', color:'var(--text-muted)', marginTop:'6px' }}>{a.remarks}</p>}
                  <p style={{ fontSize:'12px', color:'var(--text-muted)', marginTop:'4px' }}>{fmtDate(a.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="card mb-3">
            <div className="section-title">🏢 Vendor Info</div>
            <div style={{ fontSize:'14px' }}>
              <p style={{ fontWeight:600 }}>{q.vendor.company}</p>
              <p style={{ color:'var(--text-muted)', fontSize:'13px', marginTop:'4px' }}>{q.vendor.name}</p>
              <p style={{ color:'var(--text-muted)', fontSize:'13px' }}>{q.vendor.email}</p>
              <p style={{ color:'var(--text-muted)', fontSize:'13px' }}>{q.vendor.phone}</p>
              <p style={{ color:'var(--text-muted)', fontSize:'13px', marginTop:'8px' }}>GST: {q.vendor.gstNumber}</p>
            </div>
          </div>

          {q.status === 'SUBMITTED' && (
            <QuotationActions quotationId={id} />
          )}
        </div>
      </div>
    </div>
  );
}
