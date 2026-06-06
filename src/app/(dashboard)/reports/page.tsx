'use client';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface ReportData {
  totalVendors: number; totalRFQs: number; totalPOs: number; totalInvoices: number; totalSpend: number;
  monthlyData: { month: string; pos: number; invoices: number; amount: number }[];
  vendorPerformance: { company: string; category: string; totalOrders: number; totalAmount: number; quotations: number }[];
  categorySpending: { name: string; value: number }[];
}

const COLORS = ['#10b981','#3b82f6','#f59e0b','#8b5cf6','#ef4444','#06b6d4'];
const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0, notation: n >= 10000000 ? 'compact' : 'standard' }).format(n);

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports').then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, []);

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ['Company', 'Category', 'Total Orders', 'Total Amount (INR)', 'Quotations'],
      ...data.vendorPerformance.map(v => [v.company, v.category, v.totalOrders, v.totalAmount.toFixed(2), v.quotations]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'vendor-performance.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="flex-center" style={{ minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 16px' }} />
        <p className="text-muted">Loading reports...</p>
      </div>
    </div>
  );

  if (!data) return <div className="alert alert-error">Failed to load reports</div>;

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Procurement performance overview</p>
        </div>
        <button className="btn btn-secondary" onClick={exportCSV}>⬇ Export CSV</button>
      </div>

      {/* KPI Stats */}
      <div className="stats-grid mb-3">
        {[
          { icon: '🏢', label: 'Total Vendors', value: data.totalVendors, cls: 'emerald' },
          { icon: '📋', label: 'Total RFQs', value: data.totalRFQs, cls: 'blue' },
          { icon: '📦', label: 'Purchase Orders', value: data.totalPOs, cls: 'purple' },
          { icon: '🧾', label: 'Total Invoices', value: data.totalInvoices, cls: 'amber' },
          { icon: '💰', label: 'Total Spend', value: fmt(data.totalSpend), cls: 'emerald' },
          { icon: '📊', label: 'Avg Order Value', value: data.totalPOs > 0 ? fmt(data.totalSpend / data.totalPOs) : '₹0', cls: 'blue' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.cls}`}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Monthly Bar Chart */}
        <div className="card">
          <div className="card-title">📈 Monthly Procurement (Last 6 Months)</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.monthlyData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9' }} formatter={(v: any) => [v, '']} />
              <Bar dataKey="pos" name="Purchase Orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="invoices" name="Invoices" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}><div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#3b82f6' }} /> Purchase Orders</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}><div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#10b981' }} /> Invoices</div>
          </div>
        </div>

        {/* Category Pie */}
        <div className="card">
          <div className="card-title">🏷 Spend by Category</div>
          {data.categorySpending.filter(c => c.value > 0).length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <div className="empty-state-icon">📊</div>
              <p className="text-muted text-sm">No spending data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={data.categorySpending.filter(c => c.value > 0)} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                  {data.categorySpending.filter(c => c.value > 0).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9' }} formatter={(v: any) => [typeof v === 'number' ? fmt(v) : v, '']} />
                <Legend formatter={(v) => <span style={{ fontSize: '11px', color: '#94a3b8' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Vendor Performance Table */}
      <div className="card">
        <div className="flex-between mb-2">
          <div className="card-title">🏢 Vendor Performance</div>
          <button className="btn btn-secondary btn-sm" onClick={exportCSV}>⬇ Export</button>
        </div>
        {data.vendorPerformance.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🏢</div><p className="text-muted">No vendor data yet</p></div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>Vendor</th><th>Category</th><th>Quotations</th><th>Orders</th><th>Total Spend</th><th>Avg Order</th></tr>
              </thead>
              <tbody>
                {data.vendorPerformance.map(v => (
                  <tr key={v.company}>
                    <td style={{ fontWeight: 600 }}>{v.company}</td>
                    <td><span className="badge badge-info" style={{ fontSize: '11px' }}>{v.category.replace('_', ' ')}</span></td>
                    <td className="text-center">{v.quotations}</td>
                    <td className="text-center">{v.totalOrders}</td>
                    <td className="text-emerald font-semibold">{fmt(v.totalAmount)}</td>
                    <td>{v.totalOrders > 0 ? fmt(v.totalAmount / v.totalOrders) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
