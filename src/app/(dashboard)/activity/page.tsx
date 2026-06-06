import { prisma } from '@/lib/prisma';

function fmtDate(d: Date) { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }

const ACTION_ICONS: Record<string, string> = {
  RFQ_CREATED: '📋', RFQ_SENT: '📤', RFQ_STATUS_CHANGED: '📋',
  QUOTATION_SUBMITTED: '💰', QUOTATION_SELECTED: '✅', QUOTATION_STATUS_CHANGED: '💰',
  APPROVAL_APPROVED: '✅', APPROVAL_REJECTED: '❌',
  PO_CREATED: '📦', PO_STATUS_CHANGED: '📦',
  INVOICE_CREATED: '🧾', INVOICE_STATUS_CHANGED: '🧾',
  VENDOR_CREATED: '🏢', VENDOR_UPDATED: '✏️', VENDOR_DELETED: '🗑', VENDOR_STATUS_CHANGED: '🔄',
  USER_REGISTERED: '👤',
};

export default async function ActivityPage() {
  const logs = await prisma.activityLog.findMany({
    include: { user: { select: { name: true, role: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const entityTypes = [...new Set(logs.map(l => l.entityType))];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Activity Logs</h1>
          <p className="page-subtitle">{logs.length} recent actions recorded</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '24px' }}>
        {/* Summary */}
        <div>
          <div className="card mb-3">
            <div className="section-title">📊 Summary</div>
            {entityTypes.map(type => {
              const count = logs.filter(l => l.entityType === type).length;
              return (
                <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{type}</span>
                  <span className="badge badge-info">{count}</span>
                </div>
              );
            })}
          </div>
          <div className="card">
            <div className="section-title">👤 Top Users</div>
            {Object.entries(logs.reduce((acc, l) => { acc[l.user.name] = (acc[l.user.name] || 0) + 1; return acc; }, {} as Record<string, number>))
              .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '14px' }}>{name}</span>
                  <span className="badge badge-neutral">{count} actions</span>
                </div>
              ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="card">
          <div className="section-title">📜 Activity Timeline</div>
          {logs.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📜</div><p>No activity yet</p></div>
          ) : (
            <div className="timeline">
              {logs.map((log, i) => (
                <div key={log.id} className="timeline-item">
                  <div className={`timeline-dot ${i % 4 === 1 ? 'blue' : i % 4 === 2 ? 'amber' : i % 4 === 3 ? 'red' : ''}`} />
                  <div className="timeline-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div className="timeline-title">
                          {ACTION_ICONS[log.action] || '🔔'} {log.details || log.action}
                        </div>
                        <div className="timeline-meta">
                          by <strong>{log.user.name}</strong> ({log.user.role.replace('_', ' ')}) · {log.entityType}
                        </div>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: '12px' }}>{fmtDate(log.createdAt)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
