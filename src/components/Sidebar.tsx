'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface User { name: string; email: string; role: string; }

const NAV_ITEMS = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard', roles: ['ADMIN','PROCUREMENT_OFFICER','VENDOR','MANAGER'] },
  { href: '/vendors', icon: '🏢', label: 'Vendors', roles: ['ADMIN','PROCUREMENT_OFFICER'] },
  { href: '/rfq', icon: '📋', label: 'RFQs', roles: ['ADMIN','PROCUREMENT_OFFICER'] },
  { href: '/quotations', icon: '💰', label: 'Quotations', roles: ['ADMIN','PROCUREMENT_OFFICER','VENDOR'] },
  { href: '/approvals', icon: '✅', label: 'Approvals', roles: ['ADMIN','MANAGER'] },
  { href: '/purchase-orders', icon: '📦', label: 'Purchase Orders', roles: ['ADMIN','PROCUREMENT_OFFICER','VENDOR'] },
  { href: '/invoices', icon: '🧾', label: 'Invoices', roles: ['ADMIN','PROCUREMENT_OFFICER','VENDOR'] },
  { href: '/activity', icon: '📜', label: 'Activity Logs', roles: ['ADMIN','MANAGER'] },
  { href: '/reports', icon: '📈', label: 'Reports', roles: ['ADMIN','MANAGER','PROCUREMENT_OFFICER'] },
];

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrator', PROCUREMENT_OFFICER: 'Procurement Officer', VENDOR: 'Vendor', MANAGER: 'Manager',
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user) setUser(d.user); });
  }, []);

  const logout = async () => {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const visibleItems = user ? NAV_ITEMS.filter(item => item.roles.includes(user.role)) : NAV_ITEMS;

  return (
    <aside className="sidebar">
      <Link href="/dashboard" className="sidebar-logo">
        <span className="sidebar-logo-icon">⬡</span>
        <span className="sidebar-logo-text">VendorBridge</span>
      </Link>
      <nav className="sidebar-nav">
        {visibleItems.map(item => (
          <Link key={item.href} href={item.href}
            className={`sidebar-link ${pathname === item.href || pathname.startsWith(item.href + '/') ? 'active' : ''}`}>
            <span className="sidebar-link-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        {user && (
          <div className="sidebar-user">
            <div className="sidebar-avatar">{user.name[0]}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-role">{ROLE_LABELS[user.role] || user.role}</div>
            </div>
          </div>
        )}
        <button className="btn-logout" onClick={logout} disabled={loggingOut}>
          ⎋ {loggingOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    </aside>
  );
}
