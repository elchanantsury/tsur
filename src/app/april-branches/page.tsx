'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { groupBranchesByRegion, REGION_ORDER, REGION_STYLES, type BranchRegion } from '../../constants/branches';
import { fetchBranchOverrides, mergeBranches, type BranchRecord } from '../../lib/branchData';
import { useReports } from '../../context/ReportsContext';
import { Phone, MessageCircle, Navigation, Trash2, X, TrendingUp, Pencil, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Branch = BranchRecord;

function RegionSection({
  region,
  branches,
  onSelect,
}: {
  region: BranchRegion;
  branches: Branch[];
  onSelect: (b: Branch) => void;
}) {
  const style = REGION_STYLES[region];

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '8px',
        padding: '10px 14px', borderRadius: '12px',
        background: style.bg, border: `1px solid ${style.border}`,
        marginBottom: '10px',
      }}>
        <span style={{ fontWeight: '800', fontSize: '15px', color: style.color }}>
          {style.icon} {region}
        </span>
        <span style={{
          fontSize: '12px', fontWeight: '700', color: style.color,
          background: '#fff', padding: '3px 10px', borderRadius: '20px',
          border: `1px solid ${style.border}`,
        }}>
          {branches.length} סניפים
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {branches.map(b => (
          <button
            key={b.id}
            onClick={() => onSelect(b)}
            style={{
              width: '100%', background: '#fff', border: `1px solid ${style.border}`,
              borderRadius: '14px', padding: '14px 16px', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              textAlign: 'right', transition: 'all 0.18s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)', boxSizing: 'border-box',
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontWeight: '700', fontSize: '15px', color: '#0d2420', margin: 0, wordBreak: 'break-word' }}>{b.name}</p>
              <p style={{ fontSize: '12px', color: '#6aada0', margin: '3px 0 0' }}>{b.manager}</p>
            </div>
            <span style={{ color: style.color, fontSize: '18px', opacity: 0.5, flexShrink: 0, marginRight: '8px' }}>›</span>
          </button>
        ))}
      </div>
    </div>
  );
}

type RegionFilter = 'all' | BranchRegion;

export default function AprilBranchesPage() {
  const { user } = useReports();
  const canEdit = !!user;
  const [reports, setReports] = useState<any[]>([]);
  const [allBranches, setAllBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [editForm, setEditForm] = useState({ manager: '', phone: '', cell: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all');

  const loadBranches = async () => {
    const overrides = await fetchBranchOverrides();
    setAllBranches(mergeBranches(overrides));
  };

  const fetchReports = async () => {
    const { data } = await supabase.from('reports').select('id, branch');
    if (data) setReports(data);
  };

  useEffect(() => {
    loadBranches();
    fetchReports();
    const channel = supabase
      .channel('reports-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, fetchReports)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const closedBranchNames = [...new Set(reports.map((r: any) => r.branch))];
  const activeBranches = allBranches.filter(b => !closedBranchNames.includes(b.name));
  const closedCount = closedBranchNames.length;
  const activeByRegion = groupBranchesByRegion(activeBranches);
  const visibleActiveRegions = regionFilter === 'all'
    ? activeByRegion
    : activeByRegion.filter(g => g.region === regionFilter);

  const countInRegion = (region: BranchRegion) =>
    activeBranches.filter(b => b.region === region).length;

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

  const openBranch = (b: Branch) => {
    setSelectedBranch(b);
    setModalMode('view');
    setConfirmDelete(false);
    setEditForm({ manager: b.manager, phone: b.phone, cell: b.cell, address: b.address });
  };

  const closeModal = () => {
    setSelectedBranch(null);
    setModalMode('view');
    setConfirmDelete(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedBranch) return;
    setSaving(true);
    const { error } = await supabase.from('branch_overrides').upsert({
      branch_name: selectedBranch.name,
      manager: editForm.manager.trim(),
      phone: editForm.phone.trim(),
      cell: editForm.cell.trim(),
      address: editForm.address.trim(),
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) {
      alert('שגיאה בשמירה: ' + error.message + '\n\nהרץ את supabase/branch_overrides.sql');
      return;
    }
    await loadBranches();
    const overrides = await fetchBranchOverrides();
    const merged = mergeBranches(overrides);
    const updated = merged.find(b => b.name === selectedBranch.name);
    if (updated) {
      setSelectedBranch(updated);
      setEditForm({ manager: updated.manager, phone: updated.phone, cell: updated.cell, address: updated.address });
    }
    setModalMode('view');
  };

  return (
    <div dir="rtl" className="page-wrap" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{
            fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: '800', margin: 0,
            background: 'linear-gradient(120deg, #059669, #0d9488, #06b6d4)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>ניהול סניפים</h1>
          <p style={{ color: '#6aada0', margin: '4px 0 0', fontSize: '14px' }}>סניפים פעילים לפי אזורים</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'stretch' }}>
          <div style={{
            background: '#fff', border: '1px solid #d1fae5', borderRadius: '14px',
            padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px',
            boxShadow: '0 2px 12px rgba(16,185,129,0.08)', flex: '1 1 140px',
          }}>
            <TrendingUp size={18} color="#10b981" />
            <div>
              <p style={{ fontSize: '11px', color: '#6aada0', margin: 0 }}>פעילים</p>
              <p style={{ fontSize: '20px', fontWeight: '800', color: '#0d2420', margin: 0 }}>{activeBranches.length}</p>
            </div>
          </div>
          {closedCount > 0 && (
            <Link href="/reports" style={{
              background: '#f0fdf9', border: '1px solid #d1fae5', borderRadius: '14px',
              padding: '12px 16px', textDecoration: 'none', flex: '1 1 140px',
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
            }}>
              <p style={{ fontSize: '11px', color: '#6aada0', margin: 0 }}>נסגרו →</p>
              <p style={{ fontSize: '20px', fontWeight: '800', color: '#047857', margin: 0 }}>{closedCount}</p>
            </Link>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setRegionFilter('all')}
          style={regionTabStyle(regionFilter === 'all', '#0d2420', '#f0fdf9', '#d1fae5')}
        >
          הכל ({activeBranches.length})
        </button>
        {REGION_ORDER.map(region => {
          const style = REGION_STYLES[region];
          const count = countInRegion(region);
          return (
            <button
              key={region}
              onClick={() => setRegionFilter(region)}
              style={regionTabStyle(regionFilter === region, style.color, style.bg, style.border)}
            >
              {style.icon} {region} ({count})
            </button>
          );
        })}
      </div>

      <p style={{ fontWeight: '700', fontSize: '15px', color: '#134e4a', marginBottom: '16px' }}>
        סניפים פעילים ({activeBranches.length})
      </p>

      {activeBranches.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '40px 20px', color: '#94c9bf',
          background: '#f0fdf9', borderRadius: '16px', border: '1px solid #d1fae5',
        }}>
          כל הסניפים נסגרו בסבב הנוכחי
          {closedCount > 0 && (
            <p style={{ marginTop: '12px' }}>
              <Link href="/reports" style={{ color: '#047857', fontWeight: '700' }}>צפה בסניפים שנסגרו</Link>
            </p>
          )}
        </div>
      ) : visibleActiveRegions.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '32px 20px', color: '#94c9bf',
          background: '#f0fdf9', borderRadius: '16px', border: '1px solid #d1fae5',
        }}>
          אין סניפים פעילים באזור {regionFilter}
        </div>
      ) : (
        visibleActiveRegions.map(({ region, branches }) => (
          <RegionSection
            key={region}
            region={region}
            branches={branches as Branch[]}
                onSelect={openBranch}
          />
        ))
      )}

      {selectedBranch && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(13, 36, 32, 0.4)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="branch-bubble-modal"
            style={{
              background: 'rgba(255, 255, 255, 0.88)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '28px', padding: '24px',
              width: '100%', maxWidth: '380px', maxHeight: '90vh', overflowY: 'auto',
              boxShadow: '0 24px 64px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255,255,255,0.8)',
              border: '1px solid rgba(255, 255, 255, 0.6)', boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ minWidth: 0 }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0d2420', margin: 0, wordBreak: 'break-word' }}>{selectedBranch.name}</h2>
                <p style={{ fontSize: '13px', color: '#6aada0', margin: '4px 0 0' }}>{selectedBranch.region}</p>
              </div>
              <button type="button" onClick={closeModal} style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid #d1fae5', borderRadius: '10px', padding: '6px', cursor: 'pointer', color: '#6aada0' }}>
                <X size={20} />
              </button>
            </div>

            {modalMode === 'edit' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                <label style={labelStyle}>מנהלת</label>
                <input style={inputStyle} value={editForm.manager} onChange={e => setEditForm(p => ({ ...p, manager: e.target.value }))} />
                <label style={labelStyle}>טלפון משרד</label>
                <input style={inputStyle} value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} dir="ltr" />
                <label style={labelStyle}>נייד</label>
                <input style={inputStyle} value={editForm.cell} onChange={e => setEditForm(p => ({ ...p, cell: e.target.value }))} dir="ltr" />
                <label style={labelStyle}>כתובת</label>
                <input style={inputStyle} value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setModalMode('view')} style={ghostBtnStyle}>
                    ביטול
                  </button>
                  <button type="button" onClick={handleSaveEdit} disabled={saving} style={btnStyle('#10b981', '#059669', '0 4px 14px rgba(16,185,129,0.35)')}>
                    <Save size={17} /> {saving ? 'שומר...' : 'שמור'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{
                  background: 'rgba(240, 253, 249, 0.75)', border: '1px solid rgba(209, 250, 229, 0.8)',
                  borderRadius: '16px', padding: '14px 16px', marginBottom: '16px',
                }}>
                  <p style={{ fontSize: '13px', color: '#4a7c74', margin: '0 0 6px' }}>
                    <strong>מנהלת:</strong> {selectedBranch.manager}
                  </p>
                  <p style={{ fontSize: '13px', color: '#4a7c74', margin: '0 0 6px' }} dir="ltr">
                    <strong>טלפון:</strong> {selectedBranch.phone}
                  </p>
                  <p style={{ fontSize: '13px', color: '#4a7c74', margin: '0 0 6px' }} dir="ltr">
                    <strong>נייד:</strong> {selectedBranch.cell}
                  </p>
                  <p style={{ fontSize: '13px', color: '#4a7c74', margin: 0, wordBreak: 'break-word' }}>
                    <strong>כתובת:</strong> {selectedBranch.address}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button type="button" onClick={() => handleWhatsApp(selectedBranch.cell)} style={btnStyle('#10b981', '#059669', '0 4px 14px rgba(16,185,129,0.35)')}>
                    <MessageCircle size={17} /> וואטסאפ
                  </button>
                  <button type="button" onClick={() => handleWaze(selectedBranch.address)} style={btnStyle('#0d9488', '#0f766e', '0 4px 14px rgba(13,148,136,0.3)')}>
                    <Navigation size={17} /> וויז
                  </button>
                  <button type="button" onClick={() => handleCall(selectedBranch.cell)} style={btnStyle('#134e4a', '#0d2420', '0 4px 14px rgba(19,78,74,0.25)')}>
                    <Phone size={17} /> התקשר
                  </button>
                  {canEdit ? (
                    <button type="button" onClick={() => setModalMode('edit')} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      padding: '12px', borderRadius: '12px',
                      border: '1px solid rgba(59, 130, 246, 0.4)',
                      background: 'rgba(239, 246, 255, 0.9)', color: '#1d4ed8',
                      cursor: 'pointer', fontSize: '14px', fontWeight: '700', fontFamily: 'inherit',
                    }}>
                      <Pencil size={17} /> ערוך
                    </button>
                  ) : (
                    <div />
                  )}

                  {canEdit && (
                    !confirmDelete ? (
                      <button type="button" onClick={() => setConfirmDelete(true)} style={{
                        gridColumn: '1 / -1',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        padding: '12px', borderRadius: '12px', border: '1px solid #fecdd3',
                        background: 'rgba(255, 241, 242, 0.9)', color: '#f43f5e', cursor: 'pointer',
                        fontSize: '14px', fontWeight: '600', fontFamily: 'inherit',
                      }}>
                        <Trash2 size={17} /> בטל סגירה (מחק דוח)
                      </button>
                    ) : (
                      <button type="button" onClick={() => handleDeleteBranch(selectedBranch.name)} style={{ ...btnStyle('#f43f5e', '#e11d48', '0 4px 14px rgba(244,63,94,0.3)'), gridColumn: '1 / -1' }}>
                        <Trash2 size={17} /> אשר מחיקת דוח
                      </button>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const regionTabStyle = (active: boolean, color: string, bg: string, border: string): React.CSSProperties => ({
  padding: '10px 14px',
  borderRadius: '12px',
  border: `2px solid ${active ? color : border}`,
  background: active ? bg : '#fff',
  color: active ? color : '#6aada0',
  fontWeight: '700',
  fontSize: '13px',
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'all 0.15s',
  boxShadow: active ? `0 4px 12px ${border}55` : 'none',
});

const labelStyle: React.CSSProperties = {
  fontSize: '12px', fontWeight: '700', color: '#4a7c74',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 12px', borderRadius: '10px',
  border: '1px solid #d1fae5', background: 'rgba(255,255,255,0.9)',
  fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box',
};

const ghostBtnStyle: React.CSSProperties = {
  padding: '12px', borderRadius: '12px', border: '1px solid #d1fae5',
  background: 'rgba(255,255,255,0.7)', color: '#6aada0', cursor: 'pointer',
  fontSize: '14px', fontWeight: '600', fontFamily: 'inherit',
};

const btnStyle = (from: string, to: string, shadow: string): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
  padding: '12px', borderRadius: '12px', border: 'none',
  background: `linear-gradient(135deg, ${from}, ${to})`,
  color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
  fontFamily: 'inherit', boxShadow: shadow,
});
