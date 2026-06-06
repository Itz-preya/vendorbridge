'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ROLES = [
  { value: 'PROCUREMENT_OFFICER', label: 'Procurement Officer' },
  { value: 'MANAGER', label: 'Manager / Approver' },
  { value: 'VENDOR', label: 'Vendor' },
  { value: 'ADMIN', label: 'Admin' },
];

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'PROCUREMENT_OFFICER' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name || form.name.length < 2) e.name = 'Name must be at least 2 characters';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters';
    else if (!/\d/.test(form.password)) e.password = 'Password must contain at least one number';
    if (!form.role) e.role = 'Please select a role';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError('');
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setServerError(data.error || 'Registration failed'); return; }
      router.push('/dashboard');
    } catch {
      setServerError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pwStrength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : 3;
  const strengthColors = ['', '#ef4444', '#f59e0b', '#10b981'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Strong'];

  return (
    <div className="auth-container">
      <div className="auth-card animate-slideUp" style={{ maxWidth: '480px' }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">⬡</div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join VendorBridge ERP Platform</p>
        </div>

        {serverError && <div className="alert alert-error">⚠ {serverError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <input id="name" type="text" className={`form-input ${errors.name ? 'error' : ''}`}
                placeholder="Arjun Sharma" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
              {errors.name && <p className="form-error">⚠ {errors.name}</p>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="role">Role</label>
              <select id="role" className="form-select" value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input id="email" type="email" className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="you@company.com" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
            {errors.email && <p className="form-error">⚠ {errors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input id="password" type={showPw ? 'text' : 'password'}
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Min. 6 chars with a number" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={{ paddingRight: '48px' }} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }}>
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
            {form.password && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <div style={{ flex: 1, height: '3px', borderRadius: '2px', background: 'var(--border)' }}>
                  <div style={{ width: `${(pwStrength/3)*100}%`, height: '100%', borderRadius: '2px', background: strengthColors[pwStrength], transition: 'all 0.3s' }} />
                </div>
                <span style={{ fontSize: '11px', color: strengthColors[pwStrength], fontWeight: 600 }}>{strengthLabels[pwStrength]}</span>
              </div>
            )}
            {errors.password && <p className="form-error">⚠ {errors.password}</p>}
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? <><span className="spinner" /> Creating Account...</> : '✓ Create Account'}
          </button>
        </form>

        <p className="auth-link">
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
