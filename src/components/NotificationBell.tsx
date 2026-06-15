'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useReports } from '../context/ReportsContext';
import { isManagerOrAdmin } from '../lib/roles';

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

export default function NotificationBell() {
  const { user } = useReports();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const role = user?.role;
  const visible = isManagerOrAdmin(role);

  const fetchNotifications = useCallback(async () => {
    if (!visible || !user?.id) return;
    setLoading(true);

    const { data: notifs } = await supabase
      .from('app_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(40);

    const { data: reads } = await supabase
      .from('notification_reads')
      .select('notification_id')
      .eq('user_id', user.id);

    const readSet = new Set((reads || []).map(r => r.notification_id));
    setReadIds(readSet);

    const filtered = (notifs || []).filter(n => {
      if (role === 'admin') return true;
      if (role === 'manager') return n.target_role === 'manager' || n.target_role === 'both';
      return false;
    }) as AppNotification[];

    setItems(filtered);
    setLoading(false);
  }, [visible, user?.id, role]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  if (!visible) return null;

  const unread = items.filter(n => !readIds.has(n.id)).length;

  const markRead = async (id: string) => {
    if (!user?.id || readIds.has(id)) return;
    await supabase.from('notification_reads').insert([{
      notification_id: id,
      user_id: user.id,
    }]);
    setReadIds(prev => new Set([...prev, id]));
  };

  const markAllRead = async () => {
    if (!user?.id) return;
    const unreadItems = items.filter(n => !readIds.has(n.id));
    if (unreadItems.length === 0) return;
    await supabase.from('notification_reads').insert(
      unreadItems.map(n => ({ notification_id: n.id, user_id: user.id }))
    );
    setReadIds(new Set(items.map(n => n.id)));
  };

  return (
    <div style={{ position: 'fixed', top: '14px', left: '14px', zIndex: 165 }}>
      <button
        type="button"
        onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
        aria-label="התראות"
        style={{
          width: '44px', height: '44px', borderRadius: '12px',
          border: '1px solid #d1fae5', background: unread > 0 ? '#ecfdf5' : '#fff',
          color: '#047857', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(16,185,129,0.15)', position: 'relative',
        }}
      >
        <Bell size={20} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: '800',
            minWidth: '18px', height: '18px', borderRadius: '9px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="סגור"
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: -1, background: 'transparent', border: 'none' }}
          />
          <div style={{
            position: 'absolute', top: '52px', left: 0, width: 'min(320px, calc(100vw - 28px))',
            maxHeight: '70vh', overflowY: 'auto', background: '#fff',
            borderRadius: '16px', border: '1px solid #d1fae5',
            boxShadow: '0 12px 40px rgba(0,0,0,0.12)', zIndex: 1,
          }}>
            <div style={{
              padding: '14px 16px', borderBottom: '1px solid #ecfdf5',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontWeight: '800', fontSize: '14px', color: '#0d2420' }}>התראות</span>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  style={{
                    background: 'none', border: 'none', color: '#047857',
                    fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  סמן הכל כנקרא
                </button>
              )}
            </div>

            {loading ? (
              <p style={{ padding: '20px', textAlign: 'center', color: '#94c9bf', fontSize: '13px' }}>טוען...</p>
            ) : items.length === 0 ? (
              <p style={{ padding: '24px', textAlign: 'center', color: '#94c9bf', fontSize: '13px' }}>אין התראות</p>
            ) : (
              items.map(n => (
                <Link
                  key={n.id}
                  href={n.link?.startsWith('/') ? n.link : '/'}
                  onClick={() => { markRead(n.id); setOpen(false); }}
                  style={{
                    display: 'block', padding: '12px 16px', textDecoration: 'none',
                    borderBottom: '1px solid #f0fdf9',
                    background: readIds.has(n.id) ? '#fff' : '#ecfdf5',
                  }}
                >
                  <p style={{ margin: 0, fontWeight: '700', fontSize: '13px', color: '#0d2420' }}>{n.title}</p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6aada0', lineHeight: 1.4 }}>{n.message}</p>
                  <p style={{ margin: '6px 0 0', fontSize: '10px', color: '#94c9bf' }}>
                    {new Date(n.created_at).toLocaleString('he-IL')}
                  </p>
                </Link>
              ))
            )}

            <div style={{ padding: '10px', textAlign: 'center' }}>
              <Link href="/notifications" onClick={() => setOpen(false)} style={{ fontSize: '12px', color: '#047857', fontWeight: '700' }}>
                כל ההתראות →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
