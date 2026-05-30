'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useReports } from '../context/ReportsContext';

export default function Sidebar() {
  const { user } = useReports();
  const pathname = usePathname();

  const linkStyle = (href: string, color = '#4a7c74'): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '11px 14px',
    borderRadius: '12px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.18s ease',
    background: pathname === href ? 'linear-gradient(135deg, #10b981, #0d9488)' : 'transparent',
    color: pathname === href ? '#ffffff' : color,
    boxShadow: pathname === href ? '0 4px 12px rgba(16,185,129,0.25)' : 'none',
    marginBottom: '2px',
  });

  return (
    <div style={{
      width: '240px',
      height: '100vh',
      background: 'linear-gradient(180deg, #ffffff 0%, #f0fdf9 100%)',
      position: 'fixed',
      right: 0,
      top: 0,
      zIndex: 100,
      padding: '20px 16px',
      boxSizing: 'border-box',
      borderLeft: '1px solid #d1fae5',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '-4px 0 24px rgba(16,185,129,0.06)',
      overflowY: 'auto',
    }} dir="rtl">

      {/* לוגו */}
      <div style={{ marginBottom: '24px', padding: '4px' }}>
        <img src="/logo.jpg" alt="TSUR Clean" style={{
          width: '100%', borderRadius: '14px',
          boxShadow: '0 4px 16px rgba(16,185,129,0.12)',
        }} />
      </div>

      {/* ניווט */}
      <nav style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

        {/* ראשי */}
        <Link href="/" style={linkStyle('/')}>
          <span>📊</span> לוח בקרה
        </Link>
        <Link href="/april-branches" style={linkStyle('/april-branches')}>
          <span>🏢</span> סניפי אפריל
        </Link>
        <Link href="/work-log" style={linkStyle('/work-log')}>
          <span>📅</span> יומן עבודה
        </Link>
        <Link href="/reports" style={linkStyle('/reports', '#10b981')}>
          <span>✅</span> סניפים שנסגרו
        </Link>

        {/* אזור מנהל */}
        {user?.role === 'admin' && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #d1fae5' }}>
            <p style={{
              color: '#94c9bf', fontSize: '11px', fontWeight: '700',
              marginBottom: '8px', paddingRight: '4px', letterSpacing: '0.06em',
            }}>
              אזור מנהל
            </p>
            <Link href="/finance" style={linkStyle('/finance', '#f59e0b')}>
              <span>💰</span> ניהול פיננסים
            </Link>
            <Link href="/private-clients" style={linkStyle('/private-clients', '#f59e0b')}>
              <span>👤</span> לקוחות פרטיים
            </Link>
            <Link href="/receipt-scanner" style={linkStyle('/receipt-scanner', '#f59e0b')}>
              <span>🧾</span> סורק קבלות
            </Link>
            <Link href="/admin/users" style={linkStyle('/admin/users', '#f59e0b')}>
              <span>⚙️</span> ניהול משתמשים
            </Link>
          </div>
        )}
      </nav>

      {/* משתמש */}
      <div style={{
        padding: '12px', borderRadius: '12px',
        background: '#f0fdf9', border: '1px solid #d1fae5',
        textAlign: 'center', marginTop: '16px',
      }}>
        <div style={{ fontSize: '18px', marginBottom: '4px' }}>🌿</div>
        <p style={{ fontSize: '11px', color: '#6aada0', fontWeight: '500', margin: 0 }}>
          {user ? `${user.name ?? 'משתמש'} · ${user.role}` : 'לא מחובר'}
        </p>
      </div>
    </div>
  );
}