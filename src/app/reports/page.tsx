'use client';
import { useState } from 'react';
import { useReports } from '../../context/ReportsContext';
import { supabase } from '../../lib/supabase';
import { downloadReportsProofsPdf } from '../../lib/downloadReportsPdf';
import { Trash2, Download } from 'lucide-react';

export default function ReportsPage() {
  const { reports, user } = useReports();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [localReports, setLocalReports] = useState<any[]>([]);
  const [downloading, setDownloading] = useState(false);

  const displayReports = localReports.length > 0 ? localReports : reports;
  const proofsCount = displayReports.filter((r: any) => r.signature_url || r.image_url).length;

  const handleDelete = async (reportId: string) => {
    await supabase.from('reports').delete().eq('id', reportId);
    setLocalReports(displayReports.filter((r: any) => r.id !== reportId));
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      await downloadReportsProofsPdf(displayReports);
    } catch (err) {
      console.error(err);
      alert('שגיאה ביצירת הקובץ. נסה שוב.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div dir="rtl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", maxWidth: '640px', margin: '0 auto' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: '28px', flexWrap: 'wrap', gap: '16px',
      }}>
        <div>
          <h1 style={{
            fontSize: '28px', fontWeight: '800', margin: 0,
            background: 'linear-gradient(120deg, #059669, #0d9488, #06b6d4)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>סניפים שנסגרו</h1>
          <p style={{ color: '#6aada0', margin: '4px 0 0', fontSize: '14px' }}>
            {displayReports.length} דוחות · {proofsCount} עם חתימה או תמונה
          </p>
        </div>

        {proofsCount > 0 && (
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 20px', borderRadius: '12px', border: 'none',
              background: downloading ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #0d9488)',
              color: '#fff', fontWeight: '700', fontSize: '14px',
              cursor: downloading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              boxShadow: downloading ? 'none' : '0 4px 14px rgba(16,185,129,0.35)',
            }}
          >
            <Download size={18} />
            {downloading ? 'מכין PDF...' : 'הורד הכל ל-PDF'}
          </button>
        )}
      </div>

      {displayReports.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '48px', color: '#94c9bf',
          background: '#f0fdf9', borderRadius: '16px', border: '1px solid #d1fae5',
        }}>
          <p style={{ fontSize: '36px', margin: '0 0 8px' }}>📋</p>
          <p style={{ margin: 0 }}>אין עדיין דוחות סגורים</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {displayReports.map((r: any, i: number) => (
            <div key={r.id || i} style={{
              border: '1px solid #d1fae5', borderRadius: '14px', overflow: 'hidden',
              background: '#fff', boxShadow: '0 2px 8px rgba(16,185,129,0.05)',
            }}>
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                style={{
                  width: '100%', padding: '18px 20px', background: '#fff', border: 'none',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  cursor: 'pointer', fontSize: '15px', fontWeight: '700',
                  fontFamily: 'inherit', color: '#0d2420',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {r.branch}
                  {(r.signature_url || r.image_url) && (
                    <span style={{
                      fontSize: '10px', fontWeight: '700', color: '#10b981',
                      background: '#ecfdf5', padding: '3px 8px', borderRadius: '6px',
                    }}>
                      📎 הוכחה
                    </span>
                  )}
                </span>
                <span style={{ color: '#6aada0', fontSize: '13px', fontWeight: '500' }}>
                  {r.date} {openIndex === i ? '▲' : '▼'}
                </span>
              </button>

              {openIndex === i && (
                <div style={{ padding: '20px', background: '#f8fffe', borderTop: '1px solid #d1fae5' }}>
                  <p style={{ fontWeight: '700', color: '#0d2420', marginBottom: '8px' }}>עבודות שבוצעו:</p>
                  <ul style={{ paddingRight: '20px', fontSize: '14px', color: '#4a7c74', margin: '0 0 16px' }}>
                    {r.checklist?.infinity && <li>ניקיון אינפיניטי</li>}
                    {r.checklist?.height && <li>עבודה בגובה</li>}
                    {r.checklist?.windows && <li>ניקיון חלונות</li>}
                    {r.other_text && <li>אחר: {r.other_text}</li>}
                  </ul>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                    {r.image_url && (
                      <div>
                        <p style={{ fontSize: '12px', fontWeight: '600', color: '#6aada0', marginBottom: '6px' }}>תמונה</p>
                        <img
                          src={r.image_url} alt="תמונת עבודה"
                          style={{ maxWidth: '200px', borderRadius: '10px', border: '1px solid #d1fae5' }}
                        />
                      </div>
                    )}
                    {r.signature_url && (
                      <div>
                        <p style={{ fontSize: '12px', fontWeight: '600', color: '#6aada0', marginBottom: '6px' }}>חתימה</p>
                        <img
                          src={r.signature_url} alt="חתימה"
                          style={{ maxWidth: '200px', borderRadius: '10px', border: '1px solid #d1fae5', background: '#fff' }}
                        />
                      </div>
                    )}
                  </div>

                  {user?.role === 'admin' && (
                    <button
                      onClick={() => handleDelete(r.id)}
                      style={{
                        marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '10px 16px', background: '#fff1f2', border: '1px solid #fecdd3',
                        borderRadius: '10px', color: '#f43f5e', cursor: 'pointer',
                        fontWeight: '700', fontSize: '14px', fontFamily: 'inherit',
                      }}
                    >
                      <Trash2 size={15} /> מחק דוח
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
