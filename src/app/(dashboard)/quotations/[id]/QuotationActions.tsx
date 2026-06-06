'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function QuotationActions({ quotationId }: { quotationId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<'ACCEPTED'|'REJECTED'|null>(null);

  const handleAction = async (status: 'ACCEPTED'|'REJECTED') => {
    setLoading(true); setAction(status);
    await fetch(`/api/quotations/${quotationId}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status }) });
    router.refresh();
    setLoading(false); setAction(null);
  };

  return (
    <div className="card">
      <div className="section-title">⚡ Actions</div>
      <p className="text-muted text-sm mb-2">Select this quotation as the winner or reject it.</p>
      <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
        <button className="btn btn-primary" onClick={() => handleAction('ACCEPTED')} disabled={loading}>
          {loading && action==='ACCEPTED' ? <><span className="spinner"/> Processing...</> : '✓ Accept & Send for Approval'}
        </button>
        <button className="btn btn-danger" onClick={() => handleAction('REJECTED')} disabled={loading}>
          {loading && action==='REJECTED' ? <><span className="spinner"/> Processing...</> : '✕ Reject Quotation'}
        </button>
      </div>
    </div>
  );
}
