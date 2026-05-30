'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useReports } from '../../context/ReportsContext';
import { Upload, Trash2, X } from 'lucide-react';

interface Receipt {
  id: string;
  company_name: string;
  total_price: number;
  vat: number;
  image_url: string;
  created_at: string;
}

export default function ReceiptScannerPage() {
  const { user } = useReports();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [selected, setSelected] = useState<Receipt | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<{ company_name: string; total_price: string; vat: string } | null>(null);

  const fetchReceipts = async () => {
    const { data } = await supabase.from('receipts').select('*').order('created_at', { ascending: false });
    if (data) setReceipts(data);
    setLoading(false);
  };

  useEffect(() => { fetchReceipts(); }, []);

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
    setScanning(true);
    setResult(null);

    // המרה ל-base64 ושליחה ל-Claude API
    const base64 = await new Promise<string>((res) => {
      const reader = new FileReader();
      reader.onload = () => res((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: file.type, data: base64 } },
              { type: 'text', text: 'זוהי קבלה/חשבונית. אנא חלץ: שם החברה, הסכום הכולל, וסכום המע"מ. ענה רק ב-JSON כך: {"company_name": "...", "total_price": "...", "vat": "..."}. אם לא מצאת שדה, שים ריק.' }
            ]
          }]
        })
      });
      const data = await response.json();
      const text = data.content?.[0]?.text || '{}';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
    } catch {
      setResult({ company_name: '', total_price: '', vat: '' });
    }
    setScanning(false);
  };

  const handleSave = async () => {
    if (!result) return;
    await supabase.from('receipts').insert([{
      company_name: result.company_name,
      total_price: Number(result.total_price) || 0,
      vat: Number(result.vat) || 0,
      image_url: imagePreview || '',
    }]);

    // הוסף גם להוצאות בפיננסים
    await supabase.from('transactions').insert([{
      description: `קבלה: ${result.company_name}`,
      amount: Number(result.total_price) || 0,
      type: 'expense',
    }]);

    setImagePreview(null);
    setResult(null);
    fetchReceipts();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('receipts').delete().eq('id', id);
    setSelected(null);
    fetchReceipts();
  };

  const card: React.CSSProperties = {
    background: '#fff', border: '1px solid #d1fae5', borderRadius: '16px',
    padding: '20px', boxShadow: '0 2px 12px rgba(16,185,129,0.06)',
  };

  const totalExpenses = receipts.reduce((s, r) => s + Number(r.total_price || 0), 0);

  return (
    <div dir="rtl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", maxWidth: '900px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{
          fontSize: '28px', fontWeight: '800', margin: 0,
          background: 'linear-gradient(120deg, #059669, #0d9488, #06b6d4)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>סורק קבלות</h1>
        <p style={{ color: '#6aada0', margin: '4px 0 0', fontSize: '14px' }}>
          {receipts.length} קבלות • סה"כ הוצאות: ₪{totalExpenses.toLocaleString()}
        </p>
      </div>

      {/* אזור סריקה */}
      <div style={{ ...card, marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0d2420', marginBottom: '16px' }}>סרוק קבלה חדשה</h2>

        <label style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: '12px', padding: '32px', border: '2px dashed #a7f3d0', borderRadius: '14px',
          cursor: 'pointer', background: '#f0fdf9', transition: 'all 0.18s',
        }}>
          <Upload size={32} color="#10b981" />
          <p style={{ color: '#0d9488', fontWeight: '600', fontSize: '15px', margin: 0 }}>
            {scanning ? '🔍 מנתח קבלה...' : 'לחץ לצילום או העלאת קבלה'}
          </p>
          <p style={{ color: '#94c9bf', fontSize: '12px', margin: 0 }}>תמונה תנותח אוטומטית</p>
          <input type="file" accept="image/*" capture="environment" onChange={handleImage} style={{ display: 'none' }} />
        </label>

        {imagePreview && (
          <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
            <img src={imagePreview} alt="קבלה" style={{ width: '100%', borderRadius: '12px', border: '1px solid #d1fae5' }} />
            {scanning ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6aada0' }}>
                <p style={{ fontSize: '32px' }}>🔍</p>
                <p>מנתח...</p>
              </div>
            ) : result ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ fontWeight: '700', color: '#0d2420', marginBottom: '4px' }}>תוצאות זיהוי:</p>
                <div style={{ background: '#f0fdf9', border: '1px solid #d1fae5', borderRadius: '12px', padding: '14px' }}>
                  <p style={{ fontSize: '13px', color: '#4a7c74', margin: '0 0 8px' }}><strong>חברה:</strong> {result.company_name || '—'}</p>
                  <p style={{ fontSize: '13px', color: '#4a7c74', margin: '0 0 8px' }}><strong>סכום כולל:</strong> ₪{result.total_price || '—'}</p>
                  <p style={{ fontSize: '13px', color: '#4a7c74', margin: 0 }}><strong>מע"מ:</strong> ₪{result.vat || '—'}</p>
                </div>
                <button onClick={handleSave} style={{
                  background: 'linear-gradient(135deg, #10b981, #0d9488)',
                  color: '#fff', border: 'none', borderRadius: '12px', padding: '12px',
                  fontWeight: '700', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                }}>שמור קבלה</button>
                <button onClick={() => { setImagePreview(null); setResult(null); }} style={{
                  background: 'none', color: '#94c9bf', border: '1px solid #d1fae5',
                  borderRadius: '12px', padding: '10px', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit',
                }}>ביטול</button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* היסטוריית קבלות */}
      <div style={card}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0d2420', marginBottom: '16px' }}>היסטוריית קבלות</h2>
        {loading ? (
          <p style={{ color: '#94c9bf', textAlign: 'center' }}>טוען...</p>
        ) : receipts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94c9bf' }}>
            <p style={{ fontSize: '36px' }}>🧾</p>
            <p>אין קבלות עדיין</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {receipts.map((r, i) => (
              <div key={r.id} onClick={() => setSelected(r)} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 0', borderBottom: i < receipts.length - 1 ? '1px solid #ecfdf5' : 'none',
                cursor: 'pointer',
              }}>
                <div>
                  <p style={{ fontWeight: '600', color: '#0d2420', fontSize: '14px', margin: 0 }}>{r.company_name || 'לא זוהה'}</p>
                  <p style={{ fontSize: '11px', color: '#94c9bf', margin: '2px 0 0' }}>
                    {new Date(r.created_at).toLocaleDateString('he-IL')} • מע"מ: ₪{Number(r.vat || 0).toLocaleString()}
                  </p>
                </div>
                <p style={{ fontWeight: '700', color: '#f43f5e', fontSize: '16px', margin: 0 }}>
                  ₪{Number(r.total_price || 0).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* מודל פרטי קבלה */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: '24px', padding: '28px',
            width: '100%', maxWidth: '380px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.18)', border: '1px solid #d1fae5',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0d2420', margin: 0 }}>{selected.company_name}</h2>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94c9bf' }}>
                <X size={22} />
              </button>
            </div>
            {selected.image_url && (
              <img src={selected.image_url} alt="קבלה" style={{ width: '100%', borderRadius: '12px', marginBottom: '16px', border: '1px solid #d1fae5' }} />
            )}
            <div style={{ background: '#f0fdf9', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: '#4a7c74', margin: '0 0 6px' }}><strong>סכום כולל:</strong> ₪{Number(selected.total_price).toLocaleString()}</p>
              <p style={{ fontSize: '13px', color: '#4a7c74', margin: 0 }}><strong>מע"מ:</strong> ₪{Number(selected.vat).toLocaleString()}</p>
            </div>
            <button onClick={() => handleDelete(selected.id)} style={{
              width: '100%', background: '#fff1f2', color: '#f43f5e',
              border: '1px solid #fecdd3', borderRadius: '12px', padding: '12px',
              fontWeight: '700', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}>
              <Trash2 size={16} /> מחק קבלה
            </button>
          </div>
        </div>
      )}
    </div>
  );
}