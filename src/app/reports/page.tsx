'use client';
import { useState } from 'react';
import { useReports } from '../../context/ReportsContext';

export default function ReportsPage() {
  const { reports } = useReports();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div dir="rtl" style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ color: '#0f172a', textAlign: 'center' }}>✅ סניפים שנסגרו</h1>
      {reports.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#64748b' }}>אין עדיין דוחות סגורים</p>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {reports.map((r, i) => (
            <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
              <button onClick={() => setOpenIndex(openIndex === i ? null : i)} style={{ width: '100%', padding: '20px', background: '#fff', border: 'none', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
                <span>{r.branch}</span>
                <span style={{ color: '#64748b', fontSize: '14px' }}>{r.date} {openIndex === i ? '▲' : '▼'}</span>
              </button>
              {openIndex === i && (
                <div style={{ padding: '20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                  <p><strong>עבודות שבוצעו:</strong></p>
                  <ul style={{ paddingRight: '20px', fontSize: '14px' }}>
                    {r.checklist.infinity && <li>ניקיון אינפיניטי</li>}
                    {r.checklist.height && <li>ניקיון בגובה</li>}
                    {r.checklist.windows && <li>ניקיון חלונות</li>}
                    {r.otherText && <li>אחר: {r.otherText}</li>}
                  </ul>
                  <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
                    {r.image_url && (
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '12px' }}>תמונה:</p>
                        <img src={r.image_url} alt="Work" style={{ width: '120px', borderRadius: '8px', border: '1px solid #ccc' }} />
                      </div>
                    )}
                    {r.signature && (
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '12px' }}>חתימה:</p>
                        <img src={r.signature} alt="Signature" style={{ width: '120px', borderRadius: '8px', border: '1px solid #ccc' }} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}