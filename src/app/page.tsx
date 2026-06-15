'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BRANCHES_DATA } from '../constants/branches';
import { useReports } from '../context/ReportsContext';
import { supabase } from '../lib/supabase';
import { Building2, CheckCircle2, CircleDot, Users, TrendingUp, Plus, X, ChevronLeft } from 'lucide-react';

export default function Dashboard() {
  const { reports } = useReports();
  const [todayIncome, setTodayIncome] = useState(0);
  const [briefs, setBriefs] = useState<{ id: string; text: string; done: boolean }[]>([]);
  const [newBrief, setNewBrief] = useState('');
  const [showBriefInput, setShowBriefInput] = useState(false);
  const today = new Date().toLocaleDateString('he-IL');

  const totalBranches = BRANCHES_DATA.length;
  const closedBranchNames = [...new Set(reports.map((r: any) => r.branch))];
  const closedCount = closedBranchNames.length;
  const remainingCount = totalBranches - closedCount;

  useEffect(() => {
    fetchTodayIncome();
    loadBriefs();
  }, []);

  const fetchTodayIncome = async () => {
    const { data } = await supabase
      .from('reports')
      .select('total_price, date')
      .eq('date', today);
    if (data) setTodayIncome(data.reduce((s, r) => s + Number(r.total_price || 0), 0));
  };

  const loadBriefs = () => {
    const saved = localStorage.getItem('daily_briefs');
    if (saved) setBriefs(JSON.parse(saved));
  };

  const saveBriefs = (updated: typeof briefs) => {
    setBriefs(updated);
    localStorage.setItem('daily_briefs', JSON.stringify(updated));
  };

  const addBrief = () => {
    if (!newBrief.trim()) return;
    saveBriefs([...briefs, { id: Date.now().toString(), text: newBrief.trim(), done: false }]);
    setNewBrief('');
    setShowBriefInput(false);
  };

  const toggleBrief = (id: string) =>
    saveBriefs(briefs.map(b => b.id === id ? { ...b, done: !b.done } : b));

  const deleteBrief = (id: string) =>
    saveBriefs(briefs.filter(b => b.id !== id));

  const stats = [
    {
      label: 'סניפים במערכת', value: totalBranches, sub: 'סניפי אפריל',
      icon: <Building2 size={20} />, bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8', href: '/april-branches',
    },
    {
      label: 'נסגרו', value: closedCount, sub: 'בסבב הנוכחי',
      icon: <CheckCircle2 size={20} />, bg: '#ecfdf5', border: '#6ee7b7', color: '#047857', href: '/reports',
    },
    {
      label: 'נשארו', value: remainingCount, sub: 'ממתינים',
      icon: <CircleDot size={20} />, bg: '#f0fdf9', border: '#5eead4', color: '#0f766e', href: '/april-branches',
    },
    {
      label: 'הכנסה היום', value: `₪${todayIncome.toLocaleString()}`, sub: today,
      icon: <TrendingUp size={20} />, bg: '#fefce8', border: '#fde68a', color: '#b45309', href: '/finance',
    },
    {
      label: 'לקוחות פרטיים', value: '', sub: 'ניהול לקוחות',
      icon: <Users size={20} />, bg: '#fdf4ff', border: '#e9d5ff', color: '#7c3aed', href: '/private-clients',
    },
    {
      label: 'יומן עבודה', value: '', sub: 'תכנון וסגירה',
      icon: <ChevronLeft size={20} />, bg: '#fff7ed', border: '#fed7aa', color: '#c2410c', href: '/work-log',
    },
  ];

  return (
    <div dir="rtl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", maxWidth: '1000px', margin: '0 auto' }}>

      {/* Header */}
      <header style={{ marginBottom: '28px' }}>
        <h1 style={{
          fontSize: '30px', fontWeight: '800', margin: 0,
          background: 'linear-gradient(120deg, #059669, #0d9488, #06b6d4)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          שלום, TSURClean 👋
        </h1>
        <p style={{ color: '#6aada0', marginTop: '6px', fontSize: '14px' }}>
          {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </header>

      {/* קוביות סטטיסטיקה */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {stats.map(s => (
          <Link key={s.label} href={s.href} style={{ textDecoration: 'none' }}>
            <div
              style={{
                background: s.bg, border: `1px solid ${s.border}`, borderRadius: '18px',
                padding: '18px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                transition: 'all 0.18s ease', cursor: 'pointer',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 28px rgba(0,0,0,0.09)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)';
              }}
            >
              <div style={{
                width: '38px', height: '38px', borderRadius: '12px', background: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: s.color, boxShadow: '0 2px 6px rgba(0,0,0,0.06)', marginBottom: '12px',
              }}>
                {s.icon}
              </div>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: s.color }}>{s.label}</p>
              {s.value !== '' && (
                <p style={{ margin: '6px 0 0', fontSize: '34px', fontWeight: '800', color: '#0d2420', lineHeight: 1 }}>
                  {s.value}
                </p>
              )}
              <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#94c9bf' }}>{s.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* בריף היום */}
      <div style={{
        background: '#fff', border: '1px solid #d1fae5', borderRadius: '18px',
        padding: '20px', marginBottom: '20px',
        boxShadow: '0 2px 12px rgba(16,185,129,0.06)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <p style={{ margin: 0, fontWeight: '800', color: '#0d2420', fontSize: '16px' }}>📋 בריף היום</p>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94c9bf' }}>
              {briefs.filter(b => b.done).length}/{briefs.length} הושלמו
            </p>
          </div>
          <button
            onClick={() => setShowBriefInput(!showBriefInput)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '10px', border: 'none',
              background: 'linear-gradient(135deg, #10b981, #0d9488)', color: '#fff',
              fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <Plus size={15} /> הוסף משימה
          </button>
        </div>

        {showBriefInput && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              autoFocus
              value={newBrief}
              onChange={e => setNewBrief(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addBrief()}
              placeholder="מה צריך לעשות היום?"
              style={{
                flex: 1, padding: '10px 14px', border: '1px solid #d1fae5',
                borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit',
                background: '#f0fdf9', color: '#0d2420',
              }}
            />
            <button onClick={addBrief} style={{
              padding: '10px 16px', borderRadius: '10px', border: 'none',
              background: '#10b981', color: '#fff', fontWeight: '700',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>הוסף</button>
          </div>
        )}

        {briefs.length === 0 ? (
          <p style={{ color: '#94c9bf', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>
            אין משימות להיום — לחץ "הוסף משימה" כדי להתחיל
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {briefs.map(b => (
              <div key={b.id} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px', borderRadius: '10px',
                background: b.done ? '#f0fdf9' : '#fafafa',
                border: `1px solid ${b.done ? '#a7f3d0' : '#e5e7eb'}`,
                transition: 'all 0.15s',
              }}>
                <input
                  type="checkbox" checked={b.done}
                  onChange={() => toggleBrief(b.id)}
                  style={{ width: '17px', height: '17px', accentColor: '#10b981', cursor: 'pointer' }}
                />
                <p style={{
                  flex: 1, margin: 0, fontSize: '14px', color: b.done ? '#94c9bf' : '#0d2420',
                  textDecoration: b.done ? 'line-through' : 'none', fontWeight: '500',
                }}>
                  {b.text}
                </p>
                <button onClick={() => deleteBrief(b.id)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#fca5a5', padding: '2px',
                }}>
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* מצב מערכת */}
      <div style={{
        background: '#fff', border: '1px solid #d1fae5', borderRadius: '14px',
        padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 2px 8px rgba(16,185,129,0.04)',
      }}>
        <div>
          <p style={{ margin: 0, fontWeight: '700', color: '#0d2420', fontSize: '14px' }}>מצב מערכת</p>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6aada0' }}>מחובר ומסונכרן עם Supabase</p>
        </div>
        <span style={{
          background: '#ecfdf5', color: '#10b981', padding: '6px 14px',
          borderRadius: '999px', fontWeight: '700', fontSize: '12px',
        }}>פעיל ✅</span>
      </div>
    </div>
  );
}