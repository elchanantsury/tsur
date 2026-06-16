'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function FinancePage() {
  const [reports, setReports] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('expense');

  const fetchAll = async () => {
    const [{ data: rData }, { data: tData }] = await Promise.all([
      supabase.from('reports').select('branch, total_price, date'),
      supabase.from('transactions').select('*'),
    ]);
    if (rData) setReports(rData);
    if (tData) setTransactions(tData);
  };

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel('finance-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, fetchAll)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const today = new Date().toLocaleDateString('he-IL');
  const branchIncome = reports.reduce((sum, r) => sum + Number(r.total_price || 0), 0);
  const manualIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalIncome = branchIncome + manualIncome;
  const balance = totalIncome - totalExpense;
  const todayIncome = reports
    .filter(r => r.date === today)
    .reduce((sum, r) => sum + Number(r.total_price || 0), 0);

  const handleAdd = async () => {
    if (!amount || !description) return;
    await supabase.from('transactions').insert([{ amount: Number(amount), type, description }]);
    setAmount('');
    setDescription('');
    fetchAll();
  };

  const card = (bg: string, border: string): React.CSSProperties => ({
    background: bg,
    border: `1px solid ${border}`,
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    boxSizing: 'border-box',
    minWidth: 0,
  });

  return (
    <div dir="rtl" className="page-wrap" style={{ maxWidth: '900px', margin: '0 auto', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <h1 style={{
        fontSize: 'clamp(22px, 5vw, 28px)',
        fontWeight: '800',
        marginBottom: '24px',
        background: 'linear-gradient(120deg, #059669, #0d9488, #06b6d4)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>ניהול פיננסי</h1>

      <div style={{ ...card('#fffbeb', '#fde68a'), marginBottom: '16px' }}>
        <p style={{ fontSize: '12px', color: '#b45309', fontWeight: '600', marginBottom: '8px' }}>📅 הכנסת היום</p>
        <p style={{ fontSize: 'clamp(26px, 7vw, 36px)', fontWeight: '800', color: '#0d2420', margin: 0 }}>₪{todayIncome.toLocaleString()}</p>
        <p style={{ fontSize: '11px', color: '#94c9bf', marginTop: '6px' }}>{today}</p>
      </div>

      <div className="finance-stats" style={{ marginBottom: '24px' }}>
        <div style={card('#f0fdf9', '#a7f3d0')}>
          <p style={{ fontSize: '12px', color: '#6aada0', fontWeight: '600', marginBottom: '8px' }}>↗ סך הכנסות</p>
          <p style={{ fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: '800', color: '#0d2420', margin: 0 }}>₪{totalIncome.toLocaleString()}</p>
          <p style={{ fontSize: '11px', color: '#94c9bf', marginTop: '6px', lineHeight: 1.4 }}>
            מסניפים: ₪{branchIncome.toLocaleString()} · ידני: ₪{manualIncome.toLocaleString()}
          </p>
        </div>
        <div style={card('#fff1f2', '#fecdd3')}>
          <p style={{ fontSize: '12px', color: '#f43f5e', fontWeight: '600', marginBottom: '8px' }}>↘ סך הוצאות</p>
          <p style={{ fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: '800', color: '#0d2420', margin: 0 }}>₪{totalExpense.toLocaleString()}</p>
        </div>
        <div style={card(balance >= 0 ? '#eff6ff' : '#fff7ed', balance >= 0 ? '#bfdbfe' : '#fed7aa')}>
          <p style={{ fontSize: '12px', color: balance >= 0 ? '#3b82f6' : '#f97316', fontWeight: '600', marginBottom: '8px' }}>$ מאזן</p>
          <p style={{ fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: '800', color: '#0d2420', margin: 0 }}>₪{balance.toLocaleString()}</p>
        </div>
      </div>

      <div style={{ ...card('#ffffff', '#d1fae5') }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0d2420', marginBottom: '16px' }}>הוסף תנועה ידנית</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="number"
            placeholder="סכום (₪)"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{ width: '100%', padding: '12px', border: '1px solid #d1fae5', borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
          <input
            type="text"
            placeholder="תיאור"
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ width: '100%', padding: '12px', border: '1px solid #d1fae5', borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              style={{ flex: 1, minWidth: '120px', padding: '12px', border: '1px solid #d1fae5', borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', background: '#fff' }}
            >
              <option value="income">הכנסה</option>
              <option value="expense">הוצאה</option>
            </select>
            <button
              onClick={handleAdd}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #10b981, #0d9488)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
              }}
            >
              הוסף
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
