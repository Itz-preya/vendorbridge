import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';

const BADGE: Record<string, string> = { DRAFT:'badge-neutral', SENT:'badge-info', CLOSED:'badge-success', CANCELLED:'badge-danger', SUBMITTED:'badge-info', ACCEPTED:'badge-success', REJECTED:'badge-danger', UNDER_REVIEW:'badge-warning' };
function fmtDate(d: Date) { return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }); }
function fmt(n: number) { return new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(n); }

export default async function RFQDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const rfq = await prisma.rFQ.findUnique({
    where: { id },
    include: { createdBy: { select: { name: true } }, rfqVendors: { include: { vendor: true } }, quotations: { include: { vendor: { select: { company: true } } } } },
  });
  if (!rfq) notFound();

  const items = JSON.parse(rfq.items) as { name: string; description: string; quantity: number; unit: string }[];
  const isDeadlinePast = new Date(rfq.deadline) < new Date();

  return (
    <div className="animate-fadeIn" style={{ maxWidth: '900px' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{rfq.rfqNumber}</h1>
          <p className="page-subtitle">{rfq.title}</p>
        </div>
        <div className="page-actions">
          <span className={`badge ${BADGE[rfq.status] || 'badge-neutral'}`} style={{ fontSize: '14px', padding: '6px 16px' }}>{rfq.status}</span>
          {rfq.quotations.length > 1 && (
            <Link href={`/quotations/compare?rfqId=${id}`} className="btn btn-outline">⚖ Compare Quotations</Link>
          )}
          <Link href="/rfq" className="btn btn-secondary">← Back</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div>
          {/* Info */}
          <div className="card mb-3">
            <div className="section-title">📋 RFQ Information</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { label: 'Created By', value: rfq.createdBy.name },
                { label: 'Created On', value: fmtDate(rfq.createdAt) },
                { label: 'Deadline', value: fmtDate(rfq.deadline) + (isDeadlinePast ? ' ⚠ Expired' : '') },
                { label: 'Vendors Invited', value: rfq.rfqVendors.length },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', marginBottom: '4px' }}>{f.label}</div>
                  <div style={{ fontSize: '14px', color: isDeadlinePast && f.label === 'Deadline' ? 'var(--accent-red)' : 'var(--text-primary)' }}>{f.value}</div>
                </div>
              ))}
            </div>
            {rfq.description && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>DESCRIPTION</div>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>{rfq.description}</p>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="card mb-3">
            <div className="section-title">📦 Required Items</div>
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>#</th><th>Item Name</th><th>Description</th><th>Quantity</th><th>Unit</th></tr></thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i}>
                      <td className="text-muted">{i + 1}</td>
                      <td style={{ fontWeight: 500 }}>{it.name}</td>
                      <td className="text-muted text-sm">{it.description || '—'}</td>
                      <td>{it.quantity}</td>
                      <td><span className="badge badge-neutral">{it.unit}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quotations */}
          {rfq.quotations.length > 0 && (
            <div className="card">
              <div className="flex-between mb-2">
                <div className="section-title">💰 Quotations Received ({rfq.quotations.length})</div>
                {rfq.quotations.length > 1 && <Link href={`/quotations/compare?rfqId=${id}`} className="btn btn-outline btn-sm">⚖ Compare All</Link>}
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead><tr><th>Quotation #</th><th>Vendor</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>
                    {rfq.quotations.map(q => (
                      <tr key={q.id}>
                        <td style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{q.quotationNumber}</td>
                        <td>{q.vendor.company}</td>
                        <td className="text-emerald">{fmt(q.totalAmount)}</td>
                        <td><span className={`badge ${BADGE[q.status] || 'badge-neutral'}`}>{q.status}</span></td>
                        <td><Link href={`/quotations/${q.id}`} className="btn btn-secondary btn-sm">View</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <div className="card mb-3">
            <div className="section-title">🏢 Assigned Vendors</div>
            {rfq.rfqVendors.map(rv => {
              const hasQuoted = rfq.quotations.some(q => q.vendorId === rv.vendorId);
              return (
                <div key={rv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{rv.vendor.company}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{rv.vendor.email}</div>
                  </div>
                  <span className={`badge ${hasQuoted ? 'badge-success' : 'badge-warning'}`}>{hasQuoted ? '✓ Quoted' : 'Pending'}</span>
                </div>
              );
            })}
          </div>

          {/* Vendor Submit Quotation */}
          {user.role === 'VENDOR' && rfq.status === 'SENT' && (
            <div className="card">
              <div className="section-title">Submit Your Quotation</div>
              <p className="text-muted text-sm mb-2">Respond to this RFQ by submitting your pricing</p>
              <Link href={`/quotations/submit?rfqId=${id}`} className="btn btn-primary w-full">📤 Submit Quotation</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
