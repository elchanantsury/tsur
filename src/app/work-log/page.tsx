'use client';
import { useState, useEffect, useRef } from 'react';
import { BRANCHES_DATA } from '../../constants/branches';
import { supabase } from '../../lib/supabase';
import SignatureCanvas from 'react-signature-canvas';
import { Plus, X, CheckCircle, Calendar, ChevronDown } from 'lucide-react';

const TASK_PRICES = { infinity: 650, windows: 200, height: 350 };

interface ScheduledBranch {
  id: string;
  branch_name: string;
  date: string;
  round: number;
  closed: boolean;
}

interface Report {
  branch: string;
  date: string;
  round: number;
}

export default function WorkLogPage() {
  const [tab, setTab] = useState<'plan' | 'close'>('plan');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduled, setScheduled] = useState<ScheduledBranch[]>([]);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [searchBranch, setSearchBranch] = useState('');
  const [currentRound, setCurrentRound] = useState(1);

  // סגירת סניף
  const [closingBranch, setClosingBranch] = useState<ScheduledBranch | null>(null);
  const [checklist, setChecklist] = useState({ infinity: false, windows: false, height: false, other: false });
  const [otherText, setOtherText] = useState('');
  const [proofMode, setProofMode] = useState<'signature' | 'photo' | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [showSig, setShowSig] = useState(false);
  const sigCanvas = useRef<any>(null);

  const fetchData = async () => {
    const { data: sData } = await supabase
      .from('scheduled_branches').select('*').order('date');
    const { data: rData } = await supabase
      .from('reports').select('branch, date, round');
    if (sData) setScheduled(sData);
    if (rData) {
      setAllReports(rData);
      // חישוב סבב נוכחי
      const closedAll = BRANCHES_DATA.every(b =>
        rData.some((r: Report) => r.branch === b.name)
      );
      if (closedAll) {
        const maxRound = Math.max(...rData.map((r: Report) => r.round || 1), 1);
        setCurrentRound(maxRound + 1);
      } else {
        const maxRound = Math.max(...rData.map((r: Report) => r.round || 1), 1);
        setCurrentRound(maxRound);
      }
    }
  };

  useEffect(() => { fetchData(); }, []);

  const todayScheduled = scheduled.filter(s => s.date === selectedDate);
  const closedBranchNames = allReports.map(r => r.branch);

  const filteredBranches = BRANCHES_DATA.filter(b =>
    b.name.includes(searchBranch) &&
    !todayScheduled.find(s => s.branch_name === b.name)
  );

  const addBranchToDate = async (branchName: string) => {
    await supabase.from('scheduled_branches').insert([{
      branch_name: branchName,
      date: selectedDate,
      round: currentRound,
      closed: false,
    }]);
    setSearchBranch('');
    setShowAddBranch(false);
    fetchData();
  };

  const removeBranchFromDate = async (id: string) => {
    await supabase.from('scheduled_branches').delete().eq('id', id);
    fetchData();
  };

  const startClose = (branch: ScheduledBranch) => {
    setClosingBranch(branch);
    setChecklist({ infinity: false, windows: false, height: false, other: false });
    setOtherText('');
    setProofMode(null);
    setSignatureData(null);
    setPhotoData(null);
    setShowSig(false);
  };

  const calculateTotal = () => {
    let t = 0;
    if (checklist.infinity) t += TASK_PRICES.infinity;
    if (checklist.windows) t += TASK_PRICES.windows;
    if (checklist.height) t += TASK_PRICES.height;
    return t;
  };

  const isChecklistValid = checklist.infinity || checklist.windows || checklist.height ||
    (checklist.other && otherText.length > 0);
  const isProofValid = signatureData !== null || photoData !== null;
  const canSubmit = isChecklistValid && isProofValid;

  const handleFinalClose = async () => {
    if (!closingBranch) return;
    const branch = BRANCHES_DATA.find(b => b.name === closingBranch.branch_name);
    await supabase.from('reports').insert([{
      branch: closingBranch.branch_name,
      date: new Date().toLocaleDateString('he-IL'),
      checklist,
      other_text: otherText,
      signature_url: signatureData,
      image_url: photoData,
      total_price: calculateTotal(),
      round: currentRound,
    }]);
    await supabase.from('scheduled_branches')
      .update({ closed: true })
      .eq('id', closingBranch.id);
    setClosingBranch(null);
    fetchData();
  };

  const card: React.CSSProperties = {
    background: '#fff', border: '1px solid #d1fae5',
    borderRadius: '16px', padding: '20px',
    boxShadow: '0 2px 12px rgba(16,185,129,0.06)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    border: '1px solid #d1fae5', borderRadius: '10px',
    fontSize: '14px', fontFamily: 'inherit',
    background: '#fff', color: '#0d2420', boxSizing: 'border-box',
  };

  return (
    <div dir="rtl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", maxWidth: '800px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontSize: '28px', fontWeight: '800', margin: 0,
          background: 'linear-gradient(120deg, #059669, #0d9488, #06b6d4)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>יומן עבודה</h1>
        <p style={{ color: '#6aada0', margin: '4px 0 0', fontSize: '14px' }}>
          סבב {currentRound} • {allReports.length} סניפים נסגרו מתוך {BRANCHES_DATA.length}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {(['plan', 'close'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 24px', borderRadius: '12px', border: 'none',
            fontFamily: 'inherit', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
            background: tab === t ? 'linear-gradient(135deg, #10b981, #0d9488)' : '#f0fdf9',
            color: tab === t ? '#fff' : '#6aada0',
            boxShadow: tab === t ? '0 4px 12px rgba(16,185,129,0.3)' : 'none',
            transition: 'all 0.18s',
          }}>
            {t === 'plan' ? '📅 תכנון יום' : '✅ סגירת סניף'}
          </button>
        ))}
      </div>

      {/* תכנון יום */}
      {tab === 'plan' && (
        <div>
          {/* בחירת תאריך */}
          <div style={{ ...card, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Calendar size={20} color="#10b981" />
            <input
              type="date" value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              style={{ ...inputStyle, width: 'auto', flex: 1 }}
            />
            <button
              onClick={() => setShowAddBranch(!showAddBranch)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 18px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #10b981, #0d9488)', color: '#fff',
                fontWeight: '700', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
              }}
            >
              <Plus size={16} /> הוסף סניף
            </button>
          </div>

          {/* חיפוש סניף */}
          {showAddBranch && (
            <div style={{ ...card, marginBottom: '20px' }}>
              <input
                style={inputStyle} placeholder="חפש סניף..."
                value={searchBranch}
                onChange={e => setSearchBranch(e.target.value)}
                autoFocus
              />
              <div style={{ marginTop: '10px', maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {filteredBranches.slice(0, 20).map(b => (
                  <button key={b.id} onClick={() => addBranchToDate(b.name)} style={{
                    padding: '10px 14px', border: '1px solid #d1fae5', borderRadius: '10px',
                    background: '#f0fdf9', cursor: 'pointer', textAlign: 'right',
                    fontSize: '14px', color: '#0d2420', fontFamily: 'inherit',
                    display: 'flex', justifyContent: 'space-between',
                  }}>
                    <span>{b.name}</span>
                    <span style={{ fontSize: '12px', color: '#6aada0' }}>{b.region}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* רשימת סניפים לתאריך */}
          {todayScheduled.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#94c9bf' }}>
              <p style={{ fontSize: '36px' }}>📅</p>
              <p>לא תוכננו סניפים לתאריך זה</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {todayScheduled.map((s, i) => {
                const isClosed = closedBranchNames.includes(s.branch_name) || s.closed;
                return (
                  <div key={s.id} style={{
                    ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    opacity: isClosed ? 0.6 : 1,
                    borderColor: isClosed ? '#a7f3d0' : '#d1fae5',
                    background: isClosed ? '#f0fdf9' : '#fff',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%', background: isClosed ? '#10b981' : '#f0fdf9',
                        border: `2px solid ${isClosed ? '#10b981' : '#d1fae5'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isClosed ? '#fff' : '#94c9bf', fontWeight: '700', fontSize: '13px',
                      }}>
                        {isClosed ? '✓' : i + 1}
                      </div>
                      <div>
                        <p style={{ fontWeight: '700', color: '#0d2420', margin: 0, textDecoration: isClosed ? 'line-through' : 'none' }}>
                          {s.branch_name}
                        </p>
                        {isClosed && <p style={{ fontSize: '11px', color: '#10b981', margin: '2px 0 0' }}>נסגר ✓</p>}
                      </div>
                    </div>
                    <button onClick={() => removeBranchFromDate(s.id)} style={{
                      background: 'none', border: 'none', cursor: 'pointer', color: '#fca5a5', padding: '4px',
                    }}>
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* סגירת סניף */}
      {tab === 'close' && !closingBranch && (
        <div>
          <p style={{ color: '#6aada0', fontSize: '14px', marginBottom: '16px' }}>בחר סניף לסגירה:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {BRANCHES_DATA.filter(b => !closedBranchNames.includes(b.name)).map(b => {
              const isScheduledToday = todayScheduled.find(s => s.branch_name === b.name);
              return (
                <button
                  key={b.id}
                  onClick={() => startClose({ id: '', branch_name: b.name, date: selectedDate, round: currentRound, closed: false })}
                  style={{
                    width: '100%', ...card, cursor: 'pointer', border: isScheduledToday ? '2px solid #10b981' : '1px solid #d1fae5',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    textAlign: 'right', transition: 'all 0.18s',
                  }}
                >
                  <div>
                    <p style={{ fontWeight: '700', color: '#0d2420', margin: 0 }}>{b.name}</p>
                    <p style={{ fontSize: '12px', color: '#6aada0', margin: '2px 0 0' }}>{b.region}</p>
                  </div>
                  {isScheduledToday && (
                    <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '700', background: '#ecfdf5', padding: '4px 10px', borderRadius: '8px' }}>
                      מתוכנן היום
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* מסך סגירה */}
      {tab === 'close' && closingBranch && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <button onClick={() => setClosingBranch(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94c9bf' }}>
              ← חזור
            </button>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0d2420', margin: 0 }}>
              סגירת {closingBranch.branch_name}
            </h2>
          </div>

          {/* צ'קליסט */}
          <div style={{ ...card, marginBottom: '16px' }}>
            <p style={{ fontWeight: '700', color: '#0d2420', marginBottom: '14px' }}>מה בוצע? (בחר לפחות אחד)</p>
            {[
              { key: 'infinity', label: 'ניקיון אינפיניטי', price: 650 },
              { key: 'windows', label: 'ניקיון חלונות', price: 200 },
              { key: 'height', label: 'עבודה בגובה', price: 350 },
            ].map(item => (
              <label key={item.key} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px', borderRadius: '10px', cursor: 'pointer',
                marginBottom: '8px',
                background: checklist[item.key as keyof typeof checklist] ? '#ecfdf5' : '#f8fffe',
                border: `1px solid ${checklist[item.key as keyof typeof checklist] ? '#6ee7b7' : '#d1fae5'}`,
                transition: 'all 0.15s',
              }}>
                <input
                  type="checkbox"
                  checked={checklist[item.key as keyof typeof checklist]}
                  onChange={() => setChecklist(p => ({ ...p, [item.key]: !p[item.key as keyof typeof checklist] }))}
                  style={{ width: '18px', height: '18px', accentColor: '#10b981' }}
                />
                <span style={{ fontWeight: '600', color: '#0d2420', flex: 1 }}>{item.label}</span>
              </label>
            ))}
            <label style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
              borderRadius: '10px', cursor: 'pointer',
              background: checklist.other ? '#ecfdf5' : '#f8fffe',
              border: `1px solid ${checklist.other ? '#6ee7b7' : '#d1fae5'}`,
            }}>
              <input
                type="checkbox" checked={checklist.other}
                onChange={() => setChecklist(p => ({ ...p, other: !p.other }))}
                style={{ width: '18px', height: '18px', accentColor: '#10b981' }}
              />
              <span style={{ fontWeight: '600', color: '#0d2420' }}>אחר</span>
            </label>
            {checklist.other && (
              <input
                style={{ ...inputStyle, marginTop: '8px' }}
                placeholder="פרט את העבודה..."
                value={otherText}
                onChange={e => setOtherText(e.target.value)}
              />
            )}
          </div>

          {/* הוכחה */}
          <div style={{ ...card, marginBottom: '16px' }}>
            <p style={{ fontWeight: '700', color: '#0d2420', marginBottom: '14px' }}>הוכחת סיום (חתימה או תמונה)</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <button
                onClick={() => { setProofMode('signature'); setShowSig(true); }}
                style={{
                  padding: '14px', borderRadius: '12px', border: `2px solid ${signatureData ? '#10b981' : '#d1fae5'}`,
                  background: signatureData ? '#ecfdf5' : '#f0fdf9', cursor: 'pointer',
                  fontFamily: 'inherit', fontWeight: '700', fontSize: '14px',
                  color: signatureData ? '#10b981' : '#6aada0',
                }}
              >
                {signatureData ? '✅ נחתם' : '✍️ חתימת מנהלת'}
              </button>
              <label style={{
                padding: '14px', borderRadius: '12px', border: `2px solid ${photoData ? '#10b981' : '#d1fae5'}`,
                background: photoData ? '#ecfdf5' : '#f0fdf9', cursor: 'pointer',
                fontFamily: 'inherit', fontWeight: '700', fontSize: '14px',
                color: photoData ? '#10b981' : '#6aada0', textAlign: 'center',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {photoData ? '✅ צולם' : '📸 צילום / תמונה'}
                <input
                  type="file" accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) setPhotoData(URL.createObjectURL(file));
                  }}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {showSig && (
              <div style={{ border: '1px solid #d1fae5', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ background: '#f0fdf9', padding: '8px 12px', fontSize: '13px', color: '#6aada0', fontWeight: '600' }}>
                  חתימת מנהלת — {BRANCHES_DATA.find(b => b.name === closingBranch.branch_name)?.manager}
                </div>
                <SignatureCanvas
                  ref={sigCanvas}
                  canvasProps={{ width: 500, height: 160, style: { width: '100%', background: '#fff' } }}
                />
                <div style={{ display: 'flex', gap: '8px', padding: '8px' }}>
                  <button
                    onClick={() => { setSignatureData(sigCanvas.current.toDataURL()); setShowSig(false); }}
                    style={{
                      flex: 1, padding: '10px', background: 'linear-gradient(135deg, #10b981, #0d9488)',
                      color: '#fff', border: 'none', borderRadius: '8px',
                      fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    אשר חתימה
                  </button>
                  <button
                    onClick={() => sigCanvas.current.clear()}
                    style={{
                      padding: '10px 16px', background: '#f0fdf9', border: '1px solid #d1fae5',
                      borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', color: '#6aada0',
                    }}
                  >
                    נקה
                  </button>
                </div>
              </div>
            )}

            {photoData && (
              <img src={photoData} alt="הוכחה" style={{ width: '100%', borderRadius: '10px', marginTop: '10px', border: '1px solid #d1fae5' }} />
            )}
          </div>

          {/* כפתור סיום */}
          <button
            disabled={!canSubmit}
            onClick={handleFinalClose}
            style={{
              width: '100%', padding: '16px',
              background: canSubmit ? 'linear-gradient(135deg, #10b981, #0d9488)' : '#d1fae5',
              color: canSubmit ? '#fff' : '#94c9bf',
              border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '800',
              cursor: canSubmit ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
              boxShadow: canSubmit ? '0 6px 20px rgba(16,185,129,0.35)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {canSubmit ? '✅ סיום וסגירת סניף' : 'יש לסמן משימה ולהוסיף הוכחה'}
          </button>
        </div>
      )}
    </div>
  );
}