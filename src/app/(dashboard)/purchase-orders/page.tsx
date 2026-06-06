import { prisma } from '@/lib/prisma';
import Link from 'next/link';

const BADGE: Record<string,string> = { DRAFT:'badge-neutral', ISSUED:'badge-info', ACKNOWLEDGED:'badge-purple', COMPLETED:'badge-success', CANCELLED:'badge-danger' };
function fmt(n: number) { return new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(n); }
function fmtDate(d: Date) { return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }); }

export default async function PurchaseOrdersPage() {
  const pos = await prisma.purchaseOrder.findMany({
    include: { vendor: { select: { company: true } }, quotation: { select: { quotationNumber: true } }, invoice: { select: { id: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Purchase Orders</h1>
          <p className="page-subtitle">{pos.length} purchase orders total</p>
        </div>
      </div>

      {pos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <div className="empty-state-title">No purchase orders yet</div>
          <div className="empty-state-desc">POs are created automatically when a quotation is approved</div>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>PO Number</th><th>Vendor</th><th>Quotation</th><th>Subtotal</th><th>Tax (18%)</th><th>Total</th><th>Status</th><th>Invoice</th><th>Date</th><th>Action</th></tr>
            </thead>
            <tbody>
              {pos.map(po => (
                <tr key={po.id}>
                  <td style={{ color:'var(--accent-blue)', fontWeight:600 }}>{po.poNumber}</td>
                  <td>{po.vendor.company}</td>
                  <td className="text-sm text-muted">{po.quotation.quotationNumber}</td>
                  <td className="text-sm">{fmt(po.subtotal)}</td>
                  <td className="text-sm text-amber">{fmt(po.taxAmount)}</td>
                  <td className="text-emerald font-bold">{fmt(po.totalAmount)}</td>
                  <td><span className={`badge ${BADGE[po.status] || 'badge-neutral'}`}>{po.status}</span></td>
                  <td>
                    {po.invoice ? (
                      <Link href={`/invoices/${po.invoice.id}`} className="btn btn-ghost btn-sm">🧾 View</Link>
                    ) : (
                      <Link href={`/purchase-orders/${po.id}`} className="btn btn-secondary btn-sm">+ Generate</Link>
                    )}
                  </td>
                  <td className="text-sm text-muted">{fmtDate(po.createdAt)}</td>
                  <td><Link href={`/purchase-orders/${po.id}`} className="btn btn-secondary btn-sm">👁 View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
