'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useReports } from '../context/ReportsContext';
import { supabase } from '../lib/supabase';

type SidebarProps = {
  isOpen?: boolean;
  isMobile?: boolean;
  onClose?: () => void;
  onNavigate?: () => void;
};

export default function Sidebar({ onNavigate }: SidebarProps = {}) {
  const { user } = useReports();
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = user?.role === 'admin';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const linkStyle = (href: string, color = '#4a7c74'): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '11px 14px', borderRadius: '12px', textDecoration: 'none',
    fontSize: '14px', fontWeight: '500', transition: 'all 0.18s ease',
    background: pathname === href ? 'linear-gradient(135deg, #10b981, #0d9488)' : 'transparent',
    color: pathname === href ? '#ffffff' : color,
    boxShadow: pathname === href ? '0 4px 12px rgba(16,185,129,0.25)' : 'none',
    marginBottom: '2px',
  });

  return (
    <div style={{
      width: '240px', height: '100vh',
      background: 'linear-gradient(180deg, #ffffff 0%, #f0fdf9 100%)',
      position: 'fixed', right: 0, top: 0, zIndex: 100,
      padding: '20px 16px', boxSizing: 'border-box',
      borderLeft: '1px solid #d1fae5', display: 'flex',
      flexDirection: 'column', boxShadow: '-4px 0 24px rgba(16,185,129,0.06)',
      overflowY: 'auto',
    }} dir="rtl">
      <div style={{ marginBottom: '24px', padding: '4px' }}>
        <img src="/logo.jpg" alt="TSUR Clean" style={{
          width: '100%', borderRadius: '14px',
          boxShadow: '0 4px 16px rgba(16,185,129,0.12)',
        }} />
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Link href="/" onClick={onNavigate} style={linkStyle('/')}><span>📊</span> לוח בקרה</Link>
        <Link href="/april-branches" onClick={onNavigate} style={linkStyle('/april-branches')}><span>🏢</span> סניפי אפריל</Link>
        <Link href="/work-log" onClick={onNavigate} style={linkStyle('/work-log')}><span>📅</span> יומן עבודה</Link>
        <Link href="/reports" onClick={onNavigate} style={linkStyle('/reports', '#10b981')}><span>✅</span> סניפים שנסגרו</Link>
        {isAdmin && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #d1fae5' }}>
            <p style={{ color: '#94c9bf', fontSize: '11px', fontWeight: '700', marginBottom: '8px', paddingRight: '4px' }}>
              אזור מנהל
            </p>
            <Link href="/finance" onClick={onNavigate} style={linkStyle('/finance', '#f59e0b')}><span>💰</span> ניהול פיננסים</Link>
            <Link href="/private-clients" onClick={onNavigate} style={linkStyle('/private-clients', '#f59e0b')}><span>👤</span> לקוחות פרטיים</Link>
            <Link href="/receipt-scanner" onClick={onNavigate} style={linkStyle('/receipt-scanner', '#f59e0b')}><span>🧾</span> סורק קבלות</Link>
            <Link href="/admin/users" onClick={onNavigate} style={linkStyle('/admin/users', '#f59e0b')}><span>⚙️</span> ניהול משתמשים</Link>
          </div>
        )}
      </nav>

      <div style={{
        padding: '14px', borderRadius: '12px',
        background: '#f0fdf9', border: '1px solid #d1fae5',
        textAlign: 'center', marginTop: '16px',
      }}>
        <div style={{ fontSize: '18px', marginBottom: '4px' }}>🌿</div>
        <p style={{ fontSize: '11px', color: '#6aada0', fontWeight: '500', margin: '0 0 10px' }}>
          {user ? `${user.name ?? 'משתמש'} · ${user.role}` : 'לא מחובר'}
        </p>
        <button onClick={handleLogout} style={{
          width: '100%', padding: '8px', borderRadius: '8px',
          border: '1px solid #fecdd3', background: '#fff1f2',
          color: '#f43f5e', fontSize: '12px', fontWeight: '700',
          cursor: 'pointer', fontFamily: 'inherit',
        }}>התנתק</button>
      </div>
    </div>
  );
}
