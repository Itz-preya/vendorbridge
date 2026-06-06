'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Item { name: string; quantity: number; unitPrice: number; totalPrice: number; hsn?: string; }
interface Invoice {
  id: string; invoiceNumber: string; status: string; subtotal: number; cgst: number; sgst: number; igst: number; totalTax: number; totalAmount: number;
  dueDate: string | null; createdAt: string;
  vendor: { company: string; name: string; email: string; phone: string; gstNumber: string; address: string };
  purchaseOrder: { poNumber: string; quotation: { rfq: { rfqNumber: string; title: string } } };
  parsedItems: Item[];
}

function fmt(n: number) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n); }
function fmtDate(d: string | null) { return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'; }

export default function InvoiceTemplate({ invoice }: { invoice: Invoice }) {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const [emailing, setEmailing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [msg, setMsg] = useState('');

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, w, h);
    pdf.save(`${invoice.invoiceNumber}.pdf`);
  };

  const handleEmail = async () => {
    setEmailing(true); setMsg('');
    const res = await fetch(`/api/invoices/${invoice.id}/email`, { method: 'POST' });
    const data = await res.json();
    setMsg(data.message || (res.ok ? 'Email sent!' : 'Failed to send'));
    setEmailing(false);
    if (res.ok) router.refresh();
  };

  const handleMarkPaid = async () => {
    setPaying(true);
    await fetch(`/api/invoices/${invoice.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'PAID' }) });
    router.refresh();
    setPaying(false);
  };

  return (
    <div className="animate-fadeIn">
      {/* Action Bar */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div className="page-header-left">
          <h1 className="page-title">{invoice.invoiceNumber}</h1>
          <p className="page-subtitle">Invoice · {fmtDate(invoice.createdAt)}</p>
        </div>
        <div className="page-actions" style={{ flexWrap: 'wrap', gap: '10px' }}>
          {msg && <span style={{ fontSize: '13px', color: 'var(--accent-emerald)' }}>✓ {msg}</span>}
          <button className="btn btn-secondary" onClick={handleDownloadPDF}>⬇ Download PDF</button>
          <button className="btn btn-secondary" onClick={handlePrint}>🖨 Print</button>
          {invoice.status !== 'PAID' && (
            <>
              <button className="btn btn-outline" onClick={handleEmail} disabled={emailing}>
                {emailing ? <><span className="spinner" /> Sending...</> : '📧 Email to Vendor'}
              </button>
              <button className="btn btn-primary" onClick={handleMarkPaid} disabled={paying}>
                {paying ? <><span className="spinner" /> Updating...</> : '✓ Mark as Paid'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Invoice Template (printable) */}
      <div id="invoice-content" ref={printRef} className="invoice-template">
        {/* Header */}
        <div className="invoice-header">
          <div>
            <div className="invoice-brand">Vendor<span>Bridge</span></div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
              Procurement & Vendor Management ERP<br />
              GSTIN: 27AAVCS1234B1Z5<br />
              Mumbai, Maharashtra - 400001
            </div>
          </div>
          <div className="invoice-meta">
            <div className="invoice-number">{invoice.invoiceNumber}</div>
            <div className="invoice-date-info">Date: {fmtDate(invoice.createdAt)}</div>
            <div className="invoice-date-info">Due: {fmtDate(invoice.dueDate)}</div>
            <div className="invoice-date-info">PO: {invoice.purchaseOrder.poNumber}</div>
            <div style={{ marginTop: '8px', display: 'inline-block', padding: '4px 12px', borderRadius: '20px', background: invoice.status === 'PAID' ? '#dcfce7' : '#fef3c7', color: invoice.status === 'PAID' ? '#16a34a' : '#d97706', fontWeight: 700, fontSize: '12px' }}>
              {invoice.status}
            </div>
          </div>
        </div>

        {/* Parties */}
        <div className="invoice-parties">
          <div>
            <div className="invoice-party-label">Bill From</div>
            <div className="invoice-party-name">{invoice.vendor.company}</div>
            <div className="invoice-party-detail">
              {invoice.vendor.name}<br />
              {invoice.vendor.email}<br />
              {invoice.vendor.phone}<br />
              GSTIN: {invoice.vendor.gstNumber}<br />
              {invoice.vendor.address}
            </div>
          </div>
          <div>
            <div className="invoice-party-label">Bill To</div>
            <div className="invoice-party-name">VendorBridge Corp</div>
            <div className="invoice-party-detail">
              Procurement Department<br />
              accounts@vendorbridge.com<br />
              +91 22 4567 8900<br />
              GSTIN: 27AAVCS1234B1Z5<br />
              404 Tech Park, Andheri East,<br />
              Mumbai - 400069
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table className="invoice-items-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th style={{ textAlign: 'center' }}>HSN/SAC</th>
              <th style={{ textAlign: 'right' }}>Qty</th>
              <th style={{ textAlign: 'right' }}>Unit Price</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.parsedItems.map((it, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{it.name}</td>
                <td style={{ textAlign: 'center', color: '#64748b' }}>{it.hsn || '998314'}</td>
                <td style={{ textAlign: 'right' }}>{it.quantity}</td>
                <td style={{ textAlign: 'right' }}>{fmt(it.unitPrice)}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(it.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="invoice-totals">
          <div className="invoice-total-row"><span>Subtotal</span><span>{fmt(invoice.subtotal)}</span></div>
          {invoice.cgst > 0 && <>
            <div className="invoice-total-row"><span>CGST @ 9%</span><span>{fmt(invoice.cgst)}</span></div>
            <div className="invoice-total-row"><span>SGST @ 9%</span><span>{fmt(invoice.sgst)}</span></div>
          </>}
          {invoice.igst > 0 && <div className="invoice-total-row"><span>IGST @ 18%</span><span>{fmt(invoice.igst)}</span></div>}
          <div className="invoice-total-row"><span>Total Tax</span><span>{fmt(invoice.totalTax)}</span></div>
          <div className="invoice-total-row grand"><span>Grand Total</span><span>{fmt(invoice.totalAmount)}</span></div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', marginBottom: '8px' }}>Payment Terms</div>
            <p style={{ fontSize: '13px', color: '#374151' }}>Payment due within 30 days of invoice date.<br />Bank transfer preferred. NEFT/RTGS/UPI accepted.</p>
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', marginBottom: '8px' }}>Bank Details</div>
            <p style={{ fontSize: '13px', color: '#374151' }}>Bank: HDFC Bank Ltd<br />Account: 5020XXXX1234<br />IFSC: HDFC0000123</p>
          </div>
        </div>
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', marginTop: '32px' }}>
          Thank you for your business. Generated by VendorBridge ERP · {invoice.invoiceNumber}
        </p>
      </div>
    </div>
  );
}
