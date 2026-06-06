import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';

function fmt(n: number) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n); }
function fmtDate(d: Date) { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'badge-neutral', SENT: 'badge-info', CLOSED: 'badge-success', CANCELLED: 'badge-danger',
  SUBMITTED: 'badge-info', UNDER_REVIEW: 'badge-warning', ACCEPTED: 'badge-success', REJECTED: 'badge-danger',
  PENDING: 'badge-warning', APPROVED: 'badge-success',
  ISSUED: 'badge-info', ACKNOWLEDGED: 'badge-purple', COMPLETED: 'badge-success',
  PAID: 'badge-success', OVERDUE: 'badge-danger', ACTIVE: 'badge-success', INACTIVE: 'badge-neutral', BLACKLISTED: 'badge-danger',
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [vendors, rfqs, approvals, pos, invoices, recentRFQs, recentPOs, recentLogs] = await Promise.all([
    prisma.vendor.count({ where: { status: 'ACTIVE' } }),
    prisma.rFQ.count({ where: { status: 'SENT' } }),
    prisma.approval.count({ where: { status: 'PENDING' } }),
    prisma.purchaseOrder.count(),
    prisma.invoice.count(),
    prisma.rFQ.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { createdBy: true, rfqVendors: true, quotations: true } }),
    prisma.purchaseOrder.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { vendor: true } }),
    prisma.activityLog.findMany({ take: 6, orderBy: { createdAt: 'desc' }, include: { user: true } }),
  ]);

  const totalSpend = await prisma.invoice.aggregate({ _sum: { totalAmount: true }, where: { status: 'PAID' } });

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user.name} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="page-actions">
          <Link href="/rfq/new" className="btn btn-primary">+ New RFQ</Link>
          <Link href="/vendors" className="btn btn-secondary">+ Add Vendor</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card emerald">
          <div className="stat-icon">🏢</div>
          <div className="stat-value">{vendors}</div>
          <div className="stat-label">Active Vendors</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon">📋</div>
          <div className="stat-value">{rfqs}</div>
          <div className="stat-label">Active RFQs</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-icon">⏳</div>
          <div className="stat-value">{approvals}</div>
          <div className="stat-label">Pending Approvals</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon">📦</div>
          <div className="stat-value">{pos}</div>
          <div className="stat-label">Purchase Orders</div>
        </div>
        <div className="stat-card emerald">
          <div className="stat-icon">🧾</div>
          <div className="stat-value">{invoices}</div>
          <div className="stat-label">Total Invoices</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon">💰</div>
          <div className="stat-value">{totalSpend._sum.totalAmount ? fmt(totalSpend._sum.totalAmount).replace('₹', '₹') : '₹0'}</div>
          <div className="stat-label">Total Paid</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Recent RFQs */}
        <div className="card">
          <div className="flex-between mb-2">
            <div className="card-title">📋 Recent RFQs</div>
            <Link href="/rfq" className="btn btn-ghost btn-sm">View All →</Link>
          </div>
          {recentRFQs.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📋</div><p>No RFQs yet</p></div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>RFQ #</th><th>Title</th><th>Status</th><th>Deadline</th></tr></thead>
                <tbody>
                  {recentRFQs.map(r => (
                    <tr key={r.id}>
                      <td><Link href={`/rfq/${r.id}`} style={{ color: 'var(--accent-blue)' }}>{r.rfqNumber}</Link></td>
                      <td className="truncate" style={{ maxWidth: '160px' }}>{r.title}</td>
                      <td><span className={`badge ${STATUS_BADGE[r.status] || 'badge-neutral'}`}>{r.status}</span></td>
                      <td className="text-sm text-muted">{fmtDate(r.deadline)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent POs */}
        <div className="card">
          <div className="flex-between mb-2">
            <div className="card-title">📦 Recent Purchase Orders</div>
            <Link href="/purchase-orders" className="btn btn-ghost btn-sm">View All →</Link>
          </div>
          {recentPOs.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📦</div><p>No purchase orders yet</p></div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>PO #</th><th>Vendor</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {recentPOs.map(p => (
                    <tr key={p.id}>
                      <td><Link href={`/purchase-orders/${p.id}`} style={{ color: 'var(--accent-blue)' }}>{p.poNumber}</Link></td>
                      <td className="text-sm">{p.vendor.company}</td>
                      <td className="text-sm text-emerald">{fmt(p.totalAmount)}</td>
                      <td><span className={`badge ${STATUS_BADGE[p.status] || 'badge-neutral'}`}>{p.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="card mt-3">
        <div className="flex-between mb-2">
          <div className="card-title">📜 Recent Activity</div>
          <Link href="/activity" className="btn btn-ghost btn-sm">View All →</Link>
        </div>
        <div className="timeline">
          {recentLogs.map((log, i) => (
            <div key={log.id} className="timeline-item">
              <div className={`timeline-dot ${i % 3 === 1 ? 'blue' : i % 3 === 2 ? 'amber' : ''}`} />
              <div className="timeline-content">
                <div className="timeline-title">{log.details || log.action}</div>
                <div className="timeline-meta">by {log.user.name} · {fmtDate(log.createdAt)}</div>
              </div>
            </div>
          ))}
          {recentLogs.length === 0 && <p className="text-muted text-sm">No recent activity</p>}
        </div>
      </div>
    </div>
  );
}
