'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Item { name: string; quantity: number; unitPrice: number; totalPrice: number; }
interface Quotation { id: string; quotationNumber: string; totalAmount: number; deliveryTimeline: string; notes: string | null; status: string; vendor: { company: string; email: string }; parsedItems: Item[]; }
interface RFQ { id: string; rfqNumber: string; title: string; }

function fmt(n: number) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n); }

export default function CompareClient({ rfq, quotations }: { rfq: RFQ; quotations: Quotation[] }) {
  const router = useRouter();
  const [selecting, setSelecting] = useState<string | null>(null);
  const best = quotations[0]; // sorted by price asc

  const handleSelect = async (quotationId: string) => {
    if (!confirm('Select this quotation as the winner? All others will be rejected and sent for approval.')) return;
    setSelecting(quotationId);
    await fetch(`/api/quotations/${quotationId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'ACCEPTED' }) });
    router.push('/approvals');
  };

  const allItems = [...new Set(quotations.flatMap(q => q.parsedItems.map(it => it.name)))];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">⚖ Compare Quotations</h1>
          <p className="page-subtitle">{rfq.rfqNumber} · {rfq.title} · {quotations.length} quotations</p>
        </div>
        <Link href={`/rfq/${rfq.id}`} className="btn btn-secondary">← Back to RFQ</Link>
      </div>

      {/* Summary Cards */}
      <div className="comparison-grid mb-3">
        {quotations.map(q => {
          const isBest = q.id === best.id;
          return (
            <div key={q.id} className={`comparison-card ${isBest ? 'best' : ''}`}>
              {isBest && <div className="best-badge">🏆 Best Price</div>}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontWeight: 700, fontSize: '16px' }}>{q.vendor.company}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{q.quotationNumber}</div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: isBest ? 'var(--accent-emerald)' : 'var(--text-primary)', marginBottom: '8px' }}>{fmt(q.totalAmount)}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>🚚 {q.deliveryTimeline}</div>
              {q.notes && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', padding: '8px', background: 'var(--glass)', borderRadius: 'var(--radius-sm)' }}>{q.notes}</div>}

              {/* Savings */}
              {!isBest && (
                <div style={{ marginTop: '12px', padding: '8px', background: 'var(--accent-red-glow)', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--accent-red)' }}>
                  +{fmt(q.totalAmount - best.totalAmount)} more than best
                </div>
              )}

              {q.status === 'SUBMITTED' && (
                <button
                  className={`btn ${isBest ? 'btn-primary' : 'btn-secondary'} w-full`}
                  style={{ marginTop: '16px' }}
                  onClick={() => handleSelect(q.id)}
                  disabled={!!selecting}
                >
                  {selecting === q.id ? <><span className="spinner" /> Selecting...</> : isBest ? '✓ Select Winner' : 'Select This'}
                </button>
              )}
              {q.status !== 'SUBMITTED' && (
                <div className={`badge ${q.status === 'ACCEPTED' ? 'badge-success' : 'badge-neutral'}`} style={{ marginTop: '12px' }}>{q.status}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Item-by-item comparison */}
      <div className="card">
        <div className="section-title">📊 Item-by-Item Price Comparison</div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                {quotations.map(q => <th key={q.id}>{q.vendor.company}</th>)}
              </tr>
            </thead>
            <tbody>
              {allItems.map(itemName => {
                const prices = quotations.map(q => q.parsedItems.find(it => it.name === itemName)?.unitPrice || 0);
                const minPrice = Math.min(...prices.filter(p => p > 0));
                return (
                  <tr key={itemName}>
                    <td style={{ fontWeight: 500 }}>{itemName}</td>
                    {prices.map((price, i) => (
                      <td key={i} style={{ color: price === minPrice && price > 0 ? 'var(--accent-emerald)' : 'var(--text-primary)', fontWeight: price === minPrice && price > 0 ? 700 : 400 }}>
                        {price > 0 ? fmt(price) : <span className="text-muted">—</span>}
                        {price === minPrice && price > 0 && <span style={{ fontSize: '11px', marginLeft: '4px' }}>✓</span>}
                      </td>
                    ))}
                  </tr>
                );
              })}
              <tr style={{ background: 'rgba(16,185,129,0.05)', fontWeight: 700 }}>
                <td>TOTAL</td>
                {quotations.map(q => (
                  <td key={q.id} style={{ color: q.id === best.id ? 'var(--accent-emerald)' : 'var(--text-primary)', fontSize: '16px' }}>{fmt(q.totalAmount)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
