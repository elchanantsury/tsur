'use client';
import { useState, useEffect } from 'react';
import { useReports } from '../../context/ReportsContext';
import { supabase } from '../../lib/supabase';
import { BRANCHES_DATA } from '../../constants/branches';
import { isManagerOrAdmin } from '../../lib/roles';
import { createAppNotification, NOTE_CATEGORIES, targetRoleForSender } from '../../lib/notify';
import { MessageSquare, Plus, X } from 'lucide-react';

interface ManagerNote {
  id: string;
  branch_name: string | null;
  is_other: boolean;
  category: string;
  message: string;
  from_name: string;
  from_role: string;
  to_role: string;
  created_at: string;
}

export default function ManagerNotesPage() {
  const { user } = useReports();
  const [notes, setNotes] = useState<ManagerNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [branchMode, setBranchMode] = useState<'branch' | 'other'>('branch');
  const [branchSearch, setBranchSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [notifySms, setNotifySms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'inbox' | 'sent'>('all');

  const allowed = isManagerOrAdmin(user?.role);
  const myRole = user?.role === 'admin' ? 'admin' : 'manager';

  const fetchNotes = async () => {
    const { data } = await supabase
      .from('manager_notes')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setNotes(data);
    setLoading(false);
  };

  useEffect(() => {
    if (allowed) fetchNotes();
    else setLoading(false);
  }, [allowed]);

  if (!allowed) {
    return (
      <div dir="rtl" style={{ textAlign: 'center', marginTop: '80px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <p style={{ fontSize: '48px' }}>🔒</p>
        <h2 style={{ color: '#0d2420' }}>גישה למנהלים בלבד</h2>
      </div>
    );
  }

  const filteredBranches = BRANCHES_DATA.filter(b => b.name.includes(branchSearch)).slice(0, 12);
  const toRole = targetRoleForSender(myRole);
  const toLabel = toRole === 'admin' ? 'מנהל על' : 'מנהלים';

  const displayed = notes.filter(n => {
    if (filter === 'inbox') return n.to_role === myRole;
    if (filter === 'sent') return n.from_role === myRole;
    return true;
  });

  const handleSubmit = async () => {
    if (!message.trim()) {
      alert('יש לכתוב הודעה');
      return;
    }
    if (branchMode === 'branch' && !selectedBranch) {
      alert('יש לבחור סניף או לבחור "הערה אחרת"');
      return;
    }

    setSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    const isOther = branchMode === 'other';
    const branchLabel = isOther ? 'הערה כללית' : selectedBranch;

    const { error } = await supabase.from('manager_notes').insert([{
      branch_name: isOther ? null : selectedBranch,
      is_other: isOther,
      category,
      message: message.trim(),
      from_user_id: session?.user?.id,
      from_name: user?.name ?? user?.email ?? 'מנהל',
      from_role: myRole,
      to_role: toRole,
    }]);

    if (!error) {
      const catLabel = NOTE_CATEGORIES.find(c => c.value === category)?.label ?? '';
      await createAppNotification({
        type: 'manager_note',
        title: `הערה חדשה — ${branchLabel}`,
        message: `${catLabel}: ${message.trim().slice(0, 120)}`,
        link: '/manager-notes',
        branch_name: isOther ? undefined : selectedBranch,
        target_role: toRole,
        created_by_name: user?.name,
        sendSms: notifySms,
      });
    }

    setSubmitting(false);
    if (error) {
      alert('שגיאה: ' + error.message + '\n\nהרץ את supabase/manager_notes_notifications.sql');
      return;
    }

    setMessage('');
    setSelectedBranch('');
    setShowForm(false);
    fetchNotes();
  };

  const card: React.CSSProperties = {
    background: '#fff', border: '1px solid #d1fae5', borderRadius: '16px',
    padding: '20px', boxShadow: '0 2px 12px rgba(16,185,129,0.06)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', border: '1px solid #d1fae5',
    borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box',
  };

  return (
    <div dir="rtl" className="page-wrap" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{
            fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: '800', margin: 0,
            background: 'linear-gradient(120deg, #059669, #0d9488)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <MessageSquare size={26} color="#059669" style={{ WebkitTextFillColor: 'initial' }} />
            הערות מנהלים
          </h1>
          <p style={{ color: '#6aada0', margin: '4px 0 0', fontSize: '14px' }}>
            {myRole === 'admin' ? 'שליחה למנהלים' : 'שליחה למנהל על'} · תקשורת דו-כיוונית
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 18px',
            borderRadius: '12px', border: 'none',
            background: 'linear-gradient(135deg, #10b981, #0d9488)', color: '#fff',
            fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <Plus size={18} /> הערה חדשה
        </button>
      </div>

      {showForm && (
        <div style={{ ...card, marginBottom: '20px' }}>
          <p style={{ fontWeight: '700', marginBottom: '12px' }}>נמען: <span style={{ color: '#047857' }}>{toLabel}</span></p>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            {(['branch', 'other'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => { setBranchMode(m); setSelectedBranch(''); }}
                style={{
                  flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', fontWeight: '700', fontSize: '13px',
                  background: branchMode === m ? '#ecfdf5' : '#f8fffe',
                  color: branchMode === m ? '#047857' : '#6aada0',
                  outline: branchMode === m ? '2px solid #10b981' : '1px solid #d1fae5',
                }}
              >
                {m === 'branch' ? '🏢 סניף' : '📝 הערה אחרת'}
              </button>
            ))}
          </div>

          {branchMode === 'branch' && (
            <>
              {!selectedBranch ? (
                <>
                  <input style={{ ...inputStyle, marginBottom: '8px' }} placeholder="חפש סניף..." value={branchSearch} onChange={e => setBranchSearch(e.target.value)} />
                  <div style={{ maxHeight: '140px', overflowY: 'auto', marginBottom: '12px' }}>
                    {filteredBranches.map(b => (
                      <button key={b.id} type="button" onClick={() => setSelectedBranch(b.name)} style={{
                        width: '100%', padding: '8px 12px', marginBottom: '4px', textAlign: 'right',
                        border: '1px solid #d1fae5', borderRadius: '8px', background: '#f8fffe',
                        cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px',
                      }}>
                        {b.name}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#ecfdf5', borderRadius: '10px', marginBottom: '12px' }}>
                  <span style={{ fontWeight: '700' }}>{selectedBranch}</span>
                  <button type="button" onClick={() => setSelectedBranch('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
                </div>
              )}
            </>
          )}

          <label style={{ fontSize: '13px', fontWeight: '600', color: '#4a7c74' }}>סוג הודעה</label>
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, marginBottom: '12px', marginTop: '6px' }}>
            {NOTE_CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="כתוב את ההערה..."
            rows={4}
            style={{ ...inputStyle, resize: 'vertical', marginBottom: '12px' }}
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#4a7c74', marginBottom: '14px', cursor: 'pointer' }}>
            <input type="checkbox" checked={notifySms} onChange={e => setNotifySms(e.target.checked)} />
            שלח גם SMS (אם מוגדר בשרת)
          </label>

          <button type="button" onClick={handleSubmit} disabled={submitting} style={{
            width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
            background: submitting ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #0d9488)',
            color: '#fff', fontWeight: '800', cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          }}>
            {submitting ? 'שולח...' : 'שלח הערה'}
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {(['all', 'inbox', 'sent'] as const).map(f => (
          <button key={f} type="button" onClick={() => setFilter(f)} style={{
            padding: '8px 14px', borderRadius: '10px', border: 'none', fontFamily: 'inherit',
            fontWeight: '600', fontSize: '13px', cursor: 'pointer',
            background: filter === f ? '#0d2420' : '#f0fdf9',
            color: filter === f ? '#fff' : '#6aada0',
          }}>
            {f === 'all' ? 'הכל' : f === 'inbox' ? 'נכנסות' : 'נשלחו'}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#94c9bf' }}>טוען...</p>
      ) : displayed.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', color: '#94c9bf' }}>אין הערות</div>
      ) : (
        displayed.map(n => {
          const cat = NOTE_CATEGORIES.find(c => c.value === n.category)?.label ?? n.category;
          const branch = n.is_other ? 'הערה אחרת' : n.branch_name;
          const dir = n.from_role === myRole ? '← נשלח' : '→ התקבל';
          return (
            <div key={n.id} style={{ ...card, marginBottom: '10px', borderRight: `4px solid ${n.from_role === 'admin' ? '#3b82f6' : '#10b981'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontWeight: '800', fontSize: '15px' }}>{branch}</span>
                <span style={{ fontSize: '11px', color: '#6aada0' }}>{dir} · {n.from_name}</span>
              </div>
              <span style={{ fontSize: '11px', background: '#f0fdf9', padding: '2px 8px', borderRadius: '6px', color: '#047857' }}>{cat}</span>
              <p style={{ margin: '10px 0 0', fontSize: '14px', color: '#4a7c74', lineHeight: 1.5 }}>{n.message}</p>
              <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#94c9bf' }}>{new Date(n.created_at).toLocaleString('he-IL')}</p>
            </div>
          );
        })
      )}
    </div>
  );
}
