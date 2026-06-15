'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useReports } from '../../context/ReportsContext';
import { supabase } from '../../lib/supabase';
import { isManagerOrAdmin } from '../../lib/roles';
import { Bell } from 'lucide-react';

interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  branch_name?: string;
  target_role: string;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  branch_closed: 'סגירת סניף',
  sos: 'SOS',
  manager_note: 'הערת מנהל',
  system: 'מערכת',
};

export default function NotificationsPage() {
  const { user } = useReports();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const role = user?.role;
  const allowed = isManagerOrAdmin(role);

  useEffect(() => {
    if (!allowed || !user?.id) {
      setLoading(false);
      return;
    }

    const load = async () => {
      const [{ data: notifs }, { data: reads }] = await Promise.all([
        supabase.from('app_notifications').select('*').order('created_at', { ascending: false }).limit(80),
        supabase.from('notification_reads').select('notification_id').eq('user_id', user.id),
      ]);

      setReadIds(new Set((reads || []).map(r => r.notification_id)));
      const filtered = (notifs || []).filter(n => {
        if (role === 'admin') return true;
        if (role === 'manager') return n.target_role === 'manager' || n.target_role === 'both';
        return false;
      });
      setItems(filtered as AppNotification[]);
      setLoading(false);
    };

    load();
  }, [allowed, user?.id, role]);

  const markRead = async (id: string) => {
    if (!user?.id || readIds.has(id)) return;
    await supabase.from('notification_reads').insert([{ notification_id: id, user_id: user.id }]);
    setReadIds(prev => new Set([...prev, id]));
  };

  if (!allowed) {
    return (
      <div dir="rtl" style={{ textAlign: 'center', marginTop: '80px' }}>
        <p>🔒 התראות למנהלים בלבד</p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="page-wrap" style={{ maxWidth: '640px', margin: '0 auto', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <h1 style={{
        fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: '800', marginBottom: '8px',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <Bell size={26} color="#059669" />
        התראות
      </h1>
      <p style={{ color: '#6aada0', fontSize: '14px', marginBottom: '24px' }}>
        סגירת סניפים, SOS והערות — עם קישור לדף הרלוונטי
      </p>

      {loading ? (
        <p style={{ color: '#94c9bf' }}>טוען...</p>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#f0fdf9', borderRadius: '16px' }}>
          אין התראות
        </div>
      ) : (
        items.map(n => (
          <Link
            key={n.id}
            href={n.link || '/'}
            onClick={() => markRead(n.id)}
            style={{
              display: 'block', textDecoration: 'none', marginBottom: '10px',
              padding: '16px 18px', borderRadius: '14px',
              border: '1px solid #d1fae5',
              background: readIds.has(n.id) ? '#fff' : '#ecfdf5',
              boxShadow: '0 2px 8px rgba(16,185,129,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#047857' }}>
                {TYPE_LABELS[n.type] || n.type}
              </span>
              {!readIds.has(n.id) && (
                <span style={{ fontSize: '10px', background: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: '8px' }}>חדש</span>
              )}
            </div>
            <p style={{ margin: 0, fontWeight: '800', fontSize: '15px', color: '#0d2420' }}>{n.title}</p>
            {n.branch_name && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6aada0' }}>{n.branch_name}</p>}
            <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#4a7c74' }}>{n.message}</p>
            <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#94c9bf' }}>
              {new Date(n.created_at).toLocaleString('he-IL')} · לחץ לפתיחה →
            </p>
          </Link>
        ))
      )}
    </div>
  );
}
