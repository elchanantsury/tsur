'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useReports } from '../context/ReportsContext';
import { supabase } from '../lib/supabase';
import { isAdmin, isManagerOrAdmin } from '../lib/roles';
import { X } from 'lucide-react';

type SidebarProps = {
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
  onNavigate?: () => void;
};

export default function Sidebar({ isOpen, isMobile, onClose, onNavigate }: SidebarProps) {
  const { user } = useReports();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

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

  const navLink = (href: string, label: React.ReactNode, color?: string) => (
    <Link
      href={href}
      style={linkStyle(href, color)}
      onClick={onNavigate}
    >
      {label}
    </Link>
  );

  return (
    <aside
      className={`app-sidebar ${isOpen ? 'app-sidebar--open' : 'app-sidebar--closed'}`}
      dir="rtl"
      aria-hidden={!isOpen}
    >
      {isMobile && (
        <button
          type="button"
          onClick={onClose}
          className="sidebar-close-btn"
          aria-label="סגור תפריט"
        >
          <X size={20} />
        </button>
      )}

      <div style={{ marginBottom: '24px', padding: '4px' }}>
        <img src="/logo.jpg" alt="TSUR Clean" style={{
          width: '100%', borderRadius: '14px',
          boxShadow: '0 4px 16px rgba(16,185,129,0.12)',
        }} />
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {navLink('/', <><span>📊</span> לוח בקרה</>)}
        {navLink('/april-branches', <><span>🏢</span> סניפי אפריל</>)}
        {navLink('/work-log', <><span>📅</span> יומן עבודה</>)}
        {navLink('/reports', <><span>✅</span> סניפים שנסגרו</>, '#10b981')}

        {isManagerOrAdmin(user?.role) && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #d1fae5' }}>
            <p style={{
              color: '#94c9bf', fontSize: '11px', fontWeight: '700',
              marginBottom: '8px', paddingRight: '4px', letterSpacing: '0.06em',
            }}>
              {isAdmin(user?.role) ? 'אזור מנהל' : 'אזור מנהלים'}
            </p>
            {navLink('/sos', <><span>🚨</span> SOS</>, '#ef4444')}
            {navLink('/manager-notes', <><span>💬</span> הערות מנהלים</>, '#3b82f6')}
            {navLink('/notifications', <><span>🔔</span> התראות</>)}
          </div>
        )}

        {isAdmin(user?.role) && (
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #d1fae5' }}>
            {navLink('/finance', <><span>💰</span> ניהול פיננסים</>, '#f59e0b')}
            {navLink('/private-clients', <><span>👤</span> לקוחות פרטיים</>, '#f59e0b')}
            {navLink('/receipt-scanner', <><span>🧾</span> סורק קבלות</>, '#f59e0b')}
            {navLink('/admin/users', <><span>⚙️</span> ניהול משתמשים</>, '#f59e0b')}
          </div>
        )}
      </nav>

      <div style={{
        padding: '12px', borderRadius: '12px',
        background: '#f0fdf9', border: '1px solid #d1fae5',
        textAlign: 'center', marginTop: '16px',
      }}>
        <div style={{ fontSize: '18px', marginBottom: '4px' }}>🌿</div>
        <p style={{ fontSize: '11px', color: '#6aada0', fontWeight: '500', margin: '0 0 10px' }}>
          {user ? `${user.name ?? 'משתמש'} · ${user.role}` : 'לא מחובר'}
        </p>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '8px', borderRadius: '8px',
            border: '1px solid #fecdd3', background: '#fff1f2',
            color: '#f43f5e', fontSize: '12px', fontWeight: '700',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          התנתק
        </button>
      </div>
    </aside>
  );
}
