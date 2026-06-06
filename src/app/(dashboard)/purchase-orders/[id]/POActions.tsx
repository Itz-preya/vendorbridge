'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface POData { id: string; status: string; vendorId: string; items: string; subtotal: number; hasInvoice: boolean; invoiceId?: string; }

export default function POActions({ po }: { po: POData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const updateStatus = async (status: string) => {
    setLoading(true);
    const res = await fetch(`/api/purchase-orders/${po.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (!res.ok) {
      const data = await res.json();
      alert('Error: ' + data.error);
    } else {
      router.refresh();
    }
    setLoading(false);
  };

  const generateInvoice = async () => {
    setLoading(true);
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purchaseOrderId: po.id, vendorId: po.vendorId, items: po.items, subtotal: po.subtotal }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert('Error: ' + data.error);
      setLoading(false);
    } else if (data.invoice) {
      router.push(`/invoices/${data.invoice.id}`);
    } else {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="section-title">⚡ Actions</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {po.hasInvoice ? (
          <Link href={`/invoices/${po.invoiceId}`} className="btn btn-primary">🧾 View Invoice</Link>
        ) : (
          <button className="btn btn-primary" onClick={generateInvoice} disabled={loading}>
            {loading ? <><span className="spinner" /> Generating...</> : '🧾 Generate Invoice'}
          </button>
        )}
        {po.status === 'ISSUED' && (
          <button className="btn btn-secondary" onClick={() => updateStatus('ACKNOWLEDGED')} disabled={loading}>
            ✓ Mark Acknowledged
          </button>
        )}
        {po.status === 'ACKNOWLEDGED' && (
          <button className="btn btn-secondary" onClick={() => updateStatus('COMPLETED')} disabled={loading}>
            ✓ Mark Completed
          </button>
        )}
        {po.status !== 'CANCELLED' && po.status !== 'COMPLETED' && (
          <button className="btn btn-danger" onClick={() => updateStatus('CANCELLED')} disabled={loading}>
            ✕ Cancel PO
          </button>
        )}
      </div>
    </div>
  );
}
