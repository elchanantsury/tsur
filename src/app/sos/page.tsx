'use client';
import { useState, useEffect } from 'react';
import { useReports } from '../../context/ReportsContext';
import { supabase } from '../../lib/supabase';
import { BRANCHES_DATA } from '../../constants/branches';
import { isManagerOrAdmin } from '../../lib/roles';
import { createAppNotification } from '../../lib/notify';
import { AlertTriangle, Plus, Check, Trash2, X } from 'lucide-react';

type Urgency = 'low' | 'medium' | 'high' | 'critical';

interface SosAlert {
  id: string;
  branch_name: string;
  note: string;
  urgency: Urgency;
  created_by_name?: string;
  status: 'open' | 'resolved';
  created_at: string;
}

const URGENCY_OPTIONS: { value: Urgency; label: string; color: string; bg: string; border: string }[] = [
  { value: 'low', label: 'נמוכה', color: '#0369a1', bg: '#eff6ff', border: '#bfdbfe' },
  { value: 'medium', label: 'בינונית', color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  { value: 'high', label: 'גבוהה', color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
  { value: 'critical', label: 'דחופה מאוד', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
];

function urgencyStyle(urgency: Urgency) {
  return URGENCY_OPTIONS.find(u => u.value === urgency) ?? URGENCY_OPTIONS[1];
}

export default function SosPage() {
  const { user } = useReports();
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [branchSearch, setBranchSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [note, setNote] = useState('');
  const [urgency, setUrgency] = useState<Urgency>('medium');
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('open');
  const [notifySms, setNotifySms] = useState(true);
  const [notifyApp, setNotifyApp] = useState(true);

  const allowed = isManagerOrAdmin(user?.role);

  const fetchAlerts = async () => {
    const { data, error } = await supabase
      .from('sos_alerts')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setAlerts(data);
    setLoading(false);
  };

  useEffect(() => {
    if (allowed) fetchAlerts();
    else setLoading(false);
  }, [allowed]);

  if (!allowed) {
    return (
      <div dir="rtl" style={{ textAlign: 'center', marginTop: '80px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <p style={{ fontSize: '48px' }}>🔒</p>
        <h2 style={{ color: '#0d2420', fontSize: '22px', fontWeight: '700' }}>גישה מוגבלת</h2>
        <p style={{ color: '#6aada0' }}>SOS זמין למנהל ומנהל על בלבד</p>
      </div>
    );
  }

  const filteredBranches = BRANCHES_DATA.filter(b =>
    b.name.includes(branchSearch) || b.region.includes(branchSearch)
  ).slice(0, 15);

  const displayedAlerts = alerts.filter(a =>
    filter === 'all' ? true : a.status === filter
  );

  const resetForm = () => {
    setSelectedBranch('');
    setBranchSearch('');
    setNote('');
    setUrgency('medium');
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!selectedBranch || !note.trim()) {
      alert('יש לבחור סניף ולכתוב הערה');
      return;
    }
    setSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from('sos_alerts').insert([{
      branch_name: selectedBranch,
      note: note.trim(),
      urgency,
      created_by: session?.user?.id,
      created_by_name: user?.name ?? user?.email ?? 'מנהל',
      status: 'open',
    }]);
    setSubmitting(false);
    if (error) {
      alert('שגיאה בשמירה: ' + error.message + '\n\nודא שיצרת את טבלת sos_alerts ב-Supabase (ראה supabase/sos_alerts.sql)');
      return;
    }

    if (notifyApp) {
      const urgencyLabel = URGENCY_OPTIONS.find(u => u.value === urgency)?.label ?? urgency;
      await createAppNotification({
        type: 'sos',
        title: `🚨 SOS: ${selectedBranch}`,
        message: `${urgencyLabel} — ${note.trim().slice(0, 100)}`,
        link: '/sos',
        branch_name: selectedBranch,
        target_role: 'both',
        created_by_name: user?.name,
        sendSms: notifySms,
      });
    } else if (notifySms) {
      await createAppNotification({
        type: 'sos',
        title: `🚨 SOS: ${selectedBranch}`,
        message: note.trim(),
        link: '/sos',
        branch_name: selectedBranch,
        target_role: 'both',
        sendSms: true,
      });
    }

    resetForm();
    fetchAlerts();
  };

  const handleResolve = async (id: string) => {
    await supabase.from('sos_alerts').update({ status: 'resolved' }).eq('id', id);
    fetchAlerts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('למחוק התראת SOS זו?')) return;
    await supabase.from('sos_alerts').delete().eq('id', id);
    fetchAlerts();
  };

  const card: React.CSSProperties = {
    background: '#fff', border: '1px solid #d1fae5', borderRadius: '16px',
    padding: '20px', boxShadow: '0 2px 12px rgba(16,185,129,0.06)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', border: '1px solid #d1fae5',
    borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit',
    background: '#fff', color: '#0d2420', boxSizing: 'border-box',
  };

  return (
    <div dir="rtl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{
            fontSize: '28px', fontWeight: '800', margin: 0,
            background: 'linear-gradient(120deg, #dc2626, #f97316)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <AlertTriangle size={28} color="#dc2626" style={{ WebkitTextFillColor: 'initial' }} />
            SOS — התראות דחופות
          </h1>
          <p style={{ color: '#6aada0', margin: '4px 0 0', fontSize: '14px' }}>
            דיווח על סניף שדורש טיפול מיידי (מנהלים בלבד)
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 20px', borderRadius: '12px', border: 'none',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: '#fff', fontWeight: '700', fontSize: '14px',
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 14px rgba(239,68,68,0.35)',
          }}
        >
          <Plus size={18} /> התראה חדשה
        </button>
      </div>

      {showForm && (
        <div style={{ ...card, marginBottom: '24px', borderColor: '#fecaca' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0d2420', margin: 0 }}>התראת SOS חדשה</h2>
            <button onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94c9bf' }}>
              <X size={20} />
            </button>
          </div>

          <label style={{ fontSize: '13px', fontWeight: '600', color: '#4a7c74', display: 'block', marginBottom: '6px' }}>סניף</label>
          {selectedBranch ? (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: '10px', marginBottom: '12px',
            }}>
              <span style={{ fontWeight: '700', color: '#0d2420' }}>{selectedBranch}</span>
              <button onClick={() => setSelectedBranch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f43f5e' }}>
                <X size={16} />
              </button>
            </div>
          ) : (
            <>
              <input
                style={{ ...inputStyle, marginBottom: '8px' }}
                placeholder="חפש סניף..."
                value={branchSearch}
                onChange={e => setBranchSearch(e.target.value)}
              />
              <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                {filteredBranches.map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => { setSelectedBranch(b.name); setBranchSearch(''); }}
                    style={{
                      padding: '10px 12px', border: '1px solid #d1fae5', borderRadius: '8px',
                      background: '#f8fffe', cursor: 'pointer', textAlign: 'right',
                      fontFamily: 'inherit', fontSize: '13px',
                      display: 'flex', justifyContent: 'space-between',
                    }}
                  >
                    <span>{b.name}</span>
                    <span style={{ color: '#6aada0', fontSize: '11px' }}>{b.region}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          <label style={{ fontSize: '13px', fontWeight: '600', color: '#4a7c74', display: 'block', marginBottom: '6px' }}>מה נדרש בסניף?</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="פרט מה צריך לבצע, בעיות, בקשות מיוחדות..."
            rows={4}
            style={{ ...inputStyle, resize: 'vertical', marginBottom: '16px' }}
          />

          <label style={{ fontSize: '13px', fontWeight: '600', color: '#4a7c74', display: 'block', marginBottom: '8px' }}>רמת דחיפות</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '20px' }}>
            {URGENCY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setUrgency(opt.value)}
                style={{
                  padding: '12px', borderRadius: '10px', cursor: 'pointer',
                  border: `2px solid ${urgency === opt.value ? opt.color : opt.border}`,
                  background: urgency === opt.value ? opt.bg : '#fff',
                  color: opt.color, fontWeight: '700', fontSize: '13px',
                  fontFamily: 'inherit',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#4a7c74', cursor: 'pointer' }}>
              <input type="checkbox" checked={notifyApp} onChange={e => setNotifyApp(e.target.checked)} />
              התראה באפליקציה (פעמון + קישור ל-SOS)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#4a7c74', cursor: 'pointer' }}>
              <input type="checkbox" checked={notifySms} onChange={e => setNotifySms(e.target.checked)} />
              שלח גם SMS לטלפון המוגדר
            </label>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
              background: submitting ? '#94a3b8' : 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: '#fff', fontWeight: '800', fontSize: '15px',
              cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}
          >
            {submitting ? 'שולח...' : '🚨 שלח התראת SOS'}
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {(['open', 'resolved', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px', borderRadius: '10px', border: 'none',
              fontFamily: 'inherit', fontWeight: '600', fontSize: '13px', cursor: 'pointer',
              background: filter === f ? '#0d2420' : '#f0fdf9',
              color: filter === f ? '#fff' : '#6aada0',
            }}
          >
            {f === 'open' ? 'פתוחות' : f === 'resolved' ? 'טופלו' : 'הכל'}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#94c9bf' }}>טוען...</p>
      ) : displayedAlerts.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', color: '#94c9bf', padding: '40px' }}>
          <p style={{ fontSize: '32px', margin: '0 0 8px' }}>✅</p>
          <p style={{ margin: 0 }}>אין התראות SOS {filter === 'open' ? 'פתוחות' : ''}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {displayedAlerts.map(alert => {
            const u = urgencyStyle(alert.urgency);
            return (
              <div
                key={alert.id}
                style={{
                  ...card,
                  borderColor: alert.status === 'open' ? u.border : '#d1fae5',
                  borderRight: `4px solid ${u.color}`,
                  opacity: alert.status === 'resolved' ? 0.75 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '800', color: '#0d2420' }}>
                      {alert.branch_name}
                    </h3>
                    <span style={{
                      fontSize: '11px', fontWeight: '700', color: u.color,
                      background: u.bg, padding: '3px 10px', borderRadius: '8px',
                      border: `1px solid ${u.border}`,
                    }}>
                      דחיפות: {u.label}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#94c9bf' }}>
                    {new Date(alert.created_at).toLocaleString('he-IL')}
                  </span>
                </div>
                <p style={{ fontSize: '14px', color: '#4a7c74', margin: '0 0 12px', lineHeight: 1.5 }}>
                  {alert.note}
                </p>
                {alert.created_by_name && (
                  <p style={{ fontSize: '11px', color: '#94c9bf', margin: '0 0 12px' }}>
                    דווח ע״י: {alert.created_by_name}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {alert.status === 'open' && (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 14px', borderRadius: '8px', border: 'none',
                        background: '#ecfdf5', color: '#047857',
                        fontWeight: '700', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      <Check size={14} /> סמן כטופל
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(alert.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '8px 14px', borderRadius: '8px',
                      border: '1px solid #fecdd3', background: '#fff1f2',
                      color: '#f43f5e', fontWeight: '700', fontSize: '12px',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <Trash2 size={14} /> מחק
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
