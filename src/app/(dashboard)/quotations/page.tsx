import { prisma } from '@/lib/prisma';
import Link from 'next/link';

const BADGE: Record<string,string> = { SUBMITTED:'badge-info', UNDER_REVIEW:'badge-warning', ACCEPTED:'badge-success', REJECTED:'badge-danger' };
function fmt(n: number) { return new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(n); }
function fmtDate(d: Date) { return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }); }

export default async function QuotationsPage() {
  const quotations = await prisma.quotation.findMany({
    include: { rfq: { select: { rfqNumber: true, title: true } }, vendor: { select: { company: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Quotations</h1>
          <p className="page-subtitle">{quotations.length} quotations received</p>
        </div>
        <Link href="/quotations/submit" className="btn btn-primary">+ Submit Quotation</Link>
      </div>

      {quotations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💰</div>
          <div className="empty-state-title">No quotations yet</div>
          <div className="empty-state-desc">Quotations will appear here once vendors respond to RFQs</div>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Quotation #</th><th>RFQ</th><th>Vendor</th><th>Total Amount</th><th>Delivery</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {quotations.map(q => (
                <tr key={q.id}>
                  <td style={{ color:'var(--accent-blue)', fontWeight:600 }}>{q.quotationNumber}</td>
                  <td>
                    <div style={{ fontWeight:500 }}>{q.rfq.rfqNumber}</div>
                    <div style={{ fontSize:'12px', color:'var(--text-muted)' }}>{q.rfq.title}</div>
                  </td>
                  <td>{q.vendor.company}</td>
                  <td className="text-emerald font-semibold">{fmt(q.totalAmount)}</td>
                  <td className="text-sm">{q.deliveryTimeline}</td>
                  <td><span className={`badge ${BADGE[q.status] || 'badge-neutral'}`}>{q.status}</span></td>
                  <td className="text-sm text-muted">{fmtDate(q.createdAt)}</td>
                  <td>
                    <div style={{ display:'flex', gap:'6px' }}>
                      <Link href={`/quotations/${q.id}`} className="btn btn-secondary btn-sm">👁 View</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
