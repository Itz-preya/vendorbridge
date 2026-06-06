import { prisma } from '@/lib/prisma';
import Link from 'next/link';

const BADGE: Record<string,string> = { DRAFT:'badge-neutral', SENT:'badge-info', PAID:'badge-success', OVERDUE:'badge-danger', CANCELLED:'badge-neutral' };
function fmt(n: number) { return new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(n); }
function fmtDate(d: Date) { return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }); }

export default async function InvoicesPage() {
  const invoices = await prisma.invoice.findMany({
    include: { vendor: { select: { company: true } }, purchaseOrder: { select: { poNumber: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">{invoices.length} invoices total</p>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🧾</div>
          <div className="empty-state-title">No invoices yet</div>
          <div className="empty-state-desc">Generate invoices from Purchase Orders</div>
          <Link href="/purchase-orders" className="btn btn-primary">Go to Purchase Orders</Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Invoice #</th><th>PO Reference</th><th>Vendor</th><th>Subtotal</th><th>Tax</th><th>Total</th><th>Status</th><th>Due Date</th><th>Action</th></tr>
            </thead>
            <tbody>
              {invoices.map(inv => {
                const isOverdue = inv.dueDate && new Date(inv.dueDate) < new Date() && inv.status !== 'PAID';
                return (
                  <tr key={inv.id}>
                    <td style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{inv.invoiceNumber}</td>
                    <td className="text-sm text-muted">{inv.purchaseOrder.poNumber}</td>
                    <td>{inv.vendor.company}</td>
                    <td className="text-sm">{fmt(inv.subtotal)}</td>
                    <td className="text-sm text-amber">{fmt(inv.totalTax)}</td>
                    <td className="text-emerald font-bold">{fmt(inv.totalAmount)}</td>
                    <td>
                      <span className={`badge ${isOverdue ? 'badge-danger' : BADGE[inv.status] || 'badge-neutral'}`}>
                        {isOverdue ? 'OVERDUE' : inv.status}
                      </span>
                    </td>
                    <td className={`text-sm ${isOverdue ? 'text-red' : 'text-muted'}`}>
                      {inv.dueDate ? fmtDate(inv.dueDate) : '—'}
                    </td>
                    <td><Link href={`/invoices/${inv.id}`} className="btn btn-secondary btn-sm">👁 View</Link></td>
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
