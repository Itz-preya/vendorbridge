import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import POActions from './POActions';

const BADGE: Record<string,string> = { DRAFT:'badge-neutral', ISSUED:'badge-info', ACKNOWLEDGED:'badge-purple', COMPLETED:'badge-success', CANCELLED:'badge-danger' };
function fmt(n: number) { return new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(n); }
function fmtDate(d: Date) { return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }); }

export default async function PODetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { vendor: true, quotation: { include: { rfq: { select: { rfqNumber: true, title: true } } } }, invoice: true },
  });
  if (!po) notFound();
  const items = JSON.parse(po.items) as { name: string; quantity: number; unitPrice: number; totalPrice: number }[];

  return (
    <div className="animate-fadeIn" style={{ maxWidth: '900px' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{po.poNumber}</h1>
          <p className="page-subtitle">Purchase Order · {fmtDate(po.createdAt)}</p>
        </div>
        <div className="page-actions">
          <span className={`badge ${BADGE[po.status] || 'badge-neutral'}`} style={{ fontSize: '14px', padding: '6px 16px' }}>{po.status}</span>
          <Link href="/purchase-orders" className="btn btn-secondary">← Back</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div>
          <div className="card mb-3">
            <div className="section-title">📋 Order Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { label: 'RFQ Reference', value: po.quotation.rfq.rfqNumber },
                { label: 'Quotation', value: po.quotation.quotationNumber },
                { label: 'Issued On', value: fmtDate(po.createdAt) },
                { label: 'Vendor', value: po.vendor.company },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', marginBottom: '4px' }}>{f.label}</div>
                  <div style={{ fontSize: '14px' }}>{f.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card mb-3">
            <div className="section-title">📦 Order Items</div>
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{it.name}</td>
                      <td>{it.quantity}</td>
                      <td>{fmt(it.unitPrice)}</td>
                      <td>{fmt(it.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
              {[
                { label: 'Subtotal', value: fmt(po.subtotal), highlight: false },
                { label: `GST (${po.taxRate}%)`, value: fmt(po.taxAmount), highlight: false },
                { label: 'Total Amount', value: fmt(po.totalAmount), highlight: true },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', gap: '32px', justifyContent: 'space-between', width: '280px', padding: '6px 0', borderTop: r.highlight ? '2px solid var(--border)' : 'none' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{r.label}</span>
                  <span style={{ fontWeight: r.highlight ? 800 : 500, fontSize: r.highlight ? '18px' : '14px', color: r.highlight ? 'var(--accent-emerald)' : 'var(--text-primary)' }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="card mb-3">
            <div className="section-title">🏢 Vendor Details</div>
            <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
              <div style={{ fontWeight: 700 }}>{po.vendor.company}</div>
              <div style={{ color: 'var(--text-muted)' }}>{po.vendor.name}</div>
              <div style={{ color: 'var(--text-muted)' }}>{po.vendor.email}</div>
              <div style={{ color: 'var(--text-muted)' }}>{po.vendor.phone}</div>
              <div style={{ marginTop: '8px', color: 'var(--text-muted)' }}>GST: <span style={{ color: 'var(--accent-blue)' }}>{po.vendor.gstNumber}</span></div>
              <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{po.vendor.address}</div>
            </div>
          </div>

          <POActions po={{ id, status: po.status, vendorId: po.vendorId, items: po.items, subtotal: po.subtotal, hasInvoice: !!po.invoice, invoiceId: po.invoice?.id }} />
        </div>
      </div>
    </div>
  );
}
