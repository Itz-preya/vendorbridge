import { prisma } from '@/lib/prisma';
import Link from 'next/link';

const BADGE: Record<string, string> = { DRAFT:'badge-neutral', SENT:'badge-info', CLOSED:'badge-success', CANCELLED:'badge-danger' };

function fmtDate(d: Date) { return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }); }

export default async function RFQPage() {
  const rfqs = await prisma.rFQ.findMany({
    include: { createdBy: { select: { name: true } }, rfqVendors: true, quotations: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Requests for Quotation</h1>
          <p className="page-subtitle">{rfqs.length} RFQs total</p>
        </div>
        <Link href="/rfq/new" className="btn btn-primary">+ Create RFQ</Link>
      </div>

      {rfqs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">No RFQs yet</div>
          <div className="empty-state-desc">Create your first Request for Quotation</div>
          <Link href="/rfq/new" className="btn btn-primary">+ Create RFQ</Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>RFQ Number</th>
                <th>Title</th>
                <th>Vendors</th>
                <th>Quotations</th>
                <th>Status</th>
                <th>Deadline</th>
                <th>Created By</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rfqs.map(r => {
                const items = JSON.parse(r.items) as {name:string}[];
                return (
                  <tr key={r.id}>
                    <td><span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{r.rfqNumber}</span></td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{r.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{items.length} item{items.length !== 1 ? 's' : ''}</div>
                    </td>
                    <td><span className="badge badge-info">{r.rfqVendors.length}</span></td>
                    <td><span className="badge badge-neutral">{r.quotations.length}</span></td>
                    <td><span className={`badge ${BADGE[r.status] || 'badge-neutral'}`}>{r.status}</span></td>
                    <td className="text-sm">{fmtDate(r.deadline)}</td>
                    <td className="text-sm text-muted">{r.createdBy.name}</td>
                    <td>
                      <div style={{ display:'flex', gap:'6px' }}>
                        <Link href={`/rfq/${r.id}`} className="btn btn-secondary btn-sm">👁 View</Link>
                        {r.quotations.length > 1 && (
                          <Link href={`/quotations/compare?rfqId=${r.id}`} className="btn btn-outline btn-sm">⚖ Compare</Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
