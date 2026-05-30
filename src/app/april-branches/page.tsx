'use client';
import { useState, useEffect } from 'react';
import { BRANCHES_DATA } from '../../constants/branches';
import { Phone, MessageCircle, Navigation, Trash2, X, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Branch {
  id: number;
  name: string;
  manager: string;
  phone: string;
  cell: string;
  address: string;
  region: string;
}

export default function AprilBranchesPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fetchReports = async () => {
    const { data } = await supabase.from('reports').select('id, branch');
    if (data) setReports(data);
  };

  useEffect(() => {
    fetchReports();
    const channel = supabase
      .channel('reports-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, fetchReports)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const closedBranchNames = [...new Set(reports.map((r: any) => r.branch))];
  const activeBranches = BRANCHES_DATA.filter(b => !closedBranchNames.includes(b.name));
  const closedBranches = BRANCHES_DATA.filter(b => closedBranchNames.includes(b.name));

  const handleWaze = (address: string) =>
    window.open(`https://waze.com/ul?q=${encodeURIComponent(address)}`, '_blank');

  const handleWhatsApp = (cell: string) => {
    const clean = cell.replace(/\D/g, '');
    const intl = clean.startsWith('0') ? '972' + clean.slice(1) : clean;
    window.open(`https://wa.me/${intl}`, '_blank');
  };

  const handleCall = (cell: string) => {
    window.location.href = `tel:${cell}`;
  };

  const handleDeleteBranch = async (branchName: string) => {
    await supabase.from('reports').delete().eq('branch', branchName);
    await fetchReports();
    setSelectedBranch(null);
    setConfirmDelete(false);
  };

  const closeModal = () => { setSelectedBranch(null); setConfirmDelete(false); };

  return (
    <div dir="rtl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{
            fontSize: '28px', fontWeight: '800', margin: 0,
            background: 'linear-gradient(120deg, #059669, #0d9488, #06b6d4)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>ניהול סניפים</h1>
          <p style={{ color: '#6aada0', margin: '4px 0 0', fontSize: '14px' }}>סטטוס רשת אפריל</p>
        </div>
        <div style={{
          background: '#fff', border: '1px solid #d1fae5', borderRadius: '16px',
          padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px',
          boxShadow: '0 2px 12px rgba(16,185,129,0.08)',
        }}>
          <TrendingUp size={20} color="#10b981" />
          <div>
            <p style={{ fontSize: '11px', color: '#6aada0', margin: 0 }}>סניפים פעילים</p>
            <p style={{ fontSize: '22px', fontWeight: '800', color: '#0d2420', margin: 0 }}>{activeBranches.length}</p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>

        {/* Active branches */}
        <div>
          <p style={{ fontWeight: '700', fontSize: '15px', color: '#134e4a', marginBottom: '12px' }}>
            סניפים פעילים ({activeBranches.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {activeBranches.map((b) => (
              <button
                key={b.id}
                onClick={() => { setSelectedBranch(b); setConfirmDelete(false); }}
                style={{
                  width: '100%', background: '#fff', border: '1px solid #d1fae5',
                  borderRadius: '14px', padding: '16px 20px', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  textAlign: 'right', transition: 'all 0.18s ease',
                  boxShadow: '0 2px 8px rgba(16,185,129,0.05)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#6ee7b7';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(16,185,129,0.12)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#d1fae5';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(16,185,129,0.05)';
                }}
              >
                <div>
                  <p style={{ fontWeight: '700', fontSize: '15px', color: '#0d2420', margin: 0 }}>{b.name}</p>
                  <p style={{ fontSize: '12px', color: '#6aada0', margin: '3px 0 0' }}>{b.region} • {b.manager}</p>
                </div>
                <span style={{ color: '#a7f3d0', fontSize: '18px' }}>›</span>
              </button>
            ))}
          </div>
        </div>

        {/* Closed branches */}
        <div style={{
          background: '#f0fdf9', border: '1px solid #d1fae5',
          borderRadius: '16px', padding: '20px',
        }}>
          <p style={{ fontWeight: '700', fontSize: '14px', color: '#6aada0', marginBottom: '12px' }}>
            סניפים שנסגרו ({closedBranches.length})
          </p>
          {closedBranches.length === 0 && (
            <p style={{ fontSize: '13px', color: '#94c9bf' }}>אין סניפים סגורים</p>
          )}
          {closedBranches.map((b) => (
            <div key={b.id} style={{
              background: '#fff', border: '1px solid #d1fae5', borderRadius: '10px',
              padding: '10px 14px', marginBottom: '8px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <p style={{ fontSize: '13px', color: '#94c9bf', textDecoration: 'line-through', margin: 0 }}>{b.name}</p>
              <button
                onClick={() => handleDeleteBranch(b.name)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fca5a5', padding: '2px' }}
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedBranch && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff', borderRadius: '24px', padding: '28px',
              width: '100%', maxWidth: '360px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
              border: '1px solid #d1fae5',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0d2420', margin: 0 }}>{selectedBranch.name}</h2>
                <p style={{ fontSize: '13px', color: '#6aada0', margin: '4px 0 0' }}>{selectedBranch.region}</p>
              </div>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94c9bf' }}>
                <X size={22} />
              </button>
            </div>

            {/* Info */}
            <div style={{
              background: '#f0fdf9', border: '1px solid #d1fae5',
              borderRadius: '14px', padding: '14px 16px', marginBottom: '20px',
            }}>
              <p style={{ fontSize: '13px', color: '#4a7c74', margin: '0 0 6px' }}>
                <strong>מנהלת:</strong> {selectedBranch.manager}
              </p>
              <p style={{ fontSize: '13px', color: '#4a7c74', margin: 0 }}>
                <strong>כתובת:</strong> {selectedBranch.address}
              </p>
            </div>

            {/* Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button onClick={() => handleWhatsApp(selectedBranch.cell)} style={btnStyle('#10b981', '#059669', '0 4px 14px rgba(16,185,129,0.35)')}>
                <MessageCircle size={17} /> וואטסאפ
              </button>
              <button onClick={() => handleWaze(selectedBranch.address)} style={btnStyle('#0d9488', '#0f766e', '0 4px 14px rgba(13,148,136,0.3)')}>
                <Navigation size={17} /> וויז
              </button>
              <button onClick={() => handleCall(selectedBranch.cell)} style={btnStyle('#134e4a', '#0d2420', '0 4px 14px rgba(19,78,74,0.25)')}>
                <Phone size={17} /> התקשר
              </button>

              {!confirmDelete ? (
                <button onClick={() => setConfirmDelete(true)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '12px', borderRadius: '12px', border: '1px solid #fecdd3',
                  background: '#fff1f2', color: '#f43f5e', cursor: 'pointer',
                  fontSize: '14px', fontWeight: '600', fontFamily: 'inherit',
                }}>
                  <Trash2 size={17} /> מחיקה
                </button>
              ) : (
                <button onClick={() => handleDeleteBranch(selectedBranch.name)} style={btnStyle('#f43f5e', '#e11d48', '0 4px 14px rgba(244,63,94,0.3)')}>
                  <Trash2 size={17} /> אשר!
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const btnStyle = (from: string, to: string, shadow: string): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
  padding: '12px', borderRadius: '12px', border: 'none',
  background: `linear-gradient(135deg, ${from}, ${to})`,
  color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
  fontFamily: 'inherit', boxShadow: shadow,
});