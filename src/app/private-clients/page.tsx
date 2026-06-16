'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useReports } from '../../context/ReportsContext';
import { Plus, Phone, MapPin, Trash2, X } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
  price: number;
  frequency: string;
  notes: string;
  visit_date?: string | null;
}

export default function PrivateClientsPage() {
  const { user } = useReports();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Client | null>(null);
  const [form, setForm] = useState({
    name: '', phone: '', address: '', price: '', frequency: 'שבועי', notes: '',
    visit_date: new Date().toISOString().split('T')[0],
  });
  const [paidMsg, setPaidMsg] = useState('');

  const fetchClients = async () => {
    const { data } = await supabase
      .from('private_clients').select('*')
      .order('created_at', { ascending: false });
    if (data) setClients(data);
    setLoading(false);
  };

  useEffect(() => { fetchClients(); }, []);

  if (user?.role !== 'admin') {
    return (
      <div dir="rtl" style={{ textAlign: 'center', marginTop: '80px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <p style={{ fontSize: '48px' }}>🔒</p>
        <h2 style={{ color: '#0d2420', fontSize: '22px', fontWeight: '700' }}>גישה מוגבלת</h2>
        <p style={{ color: '#6aada0' }}>עמוד זה זמין למנהל בלבד</p>
      </div>
    );
  }

  const handleAdd = async () => {
    if (!form.name || !form.phone) return;
    await supabase.from('private_clients').insert([{
      name: form.name, phone: form.phone, address: form.address,
      price: Number(form.price), frequency: form.frequency, notes: form.notes,
      visit_date: form.visit_date || null,
    }]);
    setForm({
      name: '', phone: '', address: '', price: '', frequency: 'שבועי', notes: '',
      visit_date: new Date().toISOString().split('T')[0],
    });
    setShowForm(false);
    fetchClients();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('private_clients').delete().eq('id', id);
    setSelected(null);
    fetchClients();
  };

  const handleRegisterPayment = async (client: Client) => {
    setPaidMsg('');
    const { error } = await supabase.from('transactions').insert([{
      type: 'income',
      amount: Number(client.price) || 0,
      description: `לקוח פרטי: ${client.name}`,
    }]);
    if (error) {
      setPaidMsg('שגיאה ברישום התשלום');
      return;
    }
    setPaidMsg(`✅ נרשמה הכנסה של ₪${(Number(client.price) || 0).toLocaleString()} במאזן`);
  };

  const handleCall = (phone: string) => { window.location.href = `tel:${phone}`; };

  const handleWhatsApp = (phone: string) => {
    const clean = phone.replace(/\D/g, '');
    const intl = clean.startsWith('0') ? '972' + clean.slice(1) : clean;
    window.open(`https://wa.me/${intl}`, '_blank');
  };

  const cardStyle: React.CSSProperties = {
    background: '#fff', border: '1px solid #d1fae5',
    borderRadius: '16px', padding: '20px',
    boxShadow: '0 2px 12px rgba(16,185,129,0.06)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    border: '1px solid #d1fae5', borderRadius: '10px',
    fontSize: '14px', fontFamily: 'inherit',
    background: '#fff', color: '#0d2420',
    boxSizing: 'border-box',
  };

  const btnStyle = (bg: string, color = '#fff'): React.CSSProperties => ({
    background: bg, color, border: 'none', borderRadius: '12px',
    padding: '12px 20px', fontWeight: '700', fontSize: '14px',
    cursor: 'pointer', fontFamily: 'inherit',
    display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: '6px',
  });

  return (
    <div dir="rtl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", maxWidth: '900px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{
            fontSize: '28px', fontWeight: '800', margin: 0,
            background: 'linear-gradient(120deg, #059669, #0d9488, #06b6d4)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>לקוחות פרטיים</h1>
          <p style={{ color: '#6aada0', margin: '4px 0 0', fontSize: '14px' }}>
            {clients.length} לקוחות רשומים
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            ...btnStyle('linear-gradient(135deg, #10b981, #0d9488)'),
            boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
          }}
        >
          <Plus size={18} /> הוסף לקוח
        </button>
      </div>

      {/* טופס הוספה */}
      {showForm && (
        <div style={{ ...cardStyle, marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0d2420', margin: 0 }}>לקוח חדש</h2>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94c9bf' }}>
              <X size={20} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <input style={inputStyle} placeholder="שם מלא *" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <input style={inputStyle} placeholder="טלפון *" value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            <input style={inputStyle} placeholder="כתובת" value={form.address}
              onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
            <input style={inputStyle} placeholder="מחיר חודשי (₪)" type="number" value={form.price}
              onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
            <select style={inputStyle} value={form.frequency}
              onChange={e => setForm(p => ({ ...p, frequency: e.target.value }))}>
              <option>שבועי</option>
              <option>דו שבועי</option>
              <option>חודשי</option>
              <option>פעמיים בשבוע</option>
              <option>חד פעמי</option>
            </select>
            <input style={inputStyle} placeholder="הערות" value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', color: '#6aada0', fontWeight: '600' }}>תאריך ביקור</span>
              <input
                type="date" style={inputStyle} value={form.visit_date}
                onChange={e => setForm(p => ({ ...p, visit_date: e.target.value }))}
              />
            </label>
          </div>
          <button
            onClick={handleAdd}
            style={{
              ...btnStyle('linear-gradient(135deg, #10b981, #0d9488)'),
              marginTop: '16px', boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
            }}
          >
            שמור לקוח
          </button>
        </div>
      )}

      {/* רשימת לקוחות */}
      {loading ? (
        <p style={{ color: '#94c9bf', textAlign: 'center' }}>טוען...</p>
      ) : clients.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94c9bf' }}>
          <p style={{ fontSize: '40px' }}>👤</p>
          <p>אין לקוחות עדיין. הוסף את הראשון!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {clients.map(c => (
            <div
              key={c.id}
              onClick={() => { setSelected(c); setPaidMsg(''); }}
              style={{ ...cardStyle, cursor: 'pointer', transition: 'all 0.18s ease' }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = '#6ee7b7';
                el.style.transform = 'translateY(-2px)';
                el.style.boxShadow = '0 8px 24px rgba(16,185,129,0.12)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = '#d1fae5';
                el.style.transform = 'translateY(0)';
                el.style.boxShadow = '0 2px 12px rgba(16,185,129,0.06)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontWeight: '800', fontSize: '16px', color: '#0d2420', margin: 0 }}>{c.name}</p>
                  <p style={{ fontSize: '12px', color: '#6aada0', margin: '4px 0 0' }}>
                    {c.frequency}
                    {c.visit_date && ` · ${new Date(c.visit_date + 'T12:00:00').toLocaleDateString('he-IL')}`}
                  </p>
                </div>
                <p style={{ fontWeight: '800', fontSize: '18px', color: '#10b981', margin: 0 }}>
                  ₪{c.price?.toLocaleString()}
                </p>
              </div>
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <p style={{ fontSize: '13px', color: '#4a7c74', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={13} /> {c.phone}
                </p>
                {c.address && (
                  <p style={{ fontSize: '13px', color: '#4a7c74', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={13} /> {c.address}
                  </p>
                )}
                {c.notes && (
                  <p style={{ fontSize: '12px', color: '#94c9bf', margin: '4px 0 0', fontStyle: 'italic' }}>
                    {c.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* מודל */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '24px', padding: '28px',
              width: '100%', maxWidth: '360px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.18)', border: '1px solid #d1fae5',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0d2420', margin: 0 }}>{selected.name}</h2>
                <p style={{ fontSize: '13px', color: '#6aada0', margin: '4px 0 0' }}>
                  {selected.frequency} • ₪{selected.price?.toLocaleString()}
                </p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94c9bf' }}>
                <X size={22} />
              </button>
            </div>

            <div style={{ background: '#f0fdf9', border: '1px solid #d1fae5', borderRadius: '14px', padding: '14px', marginBottom: '20px' }}>
              <p style={{ fontSize: '13px', color: '#4a7c74', margin: '0 0 6px' }}>
                <strong>טלפון:</strong> {selected.phone}
              </p>
              {selected.address && (
                <p style={{ fontSize: '13px', color: '#4a7c74', margin: '0 0 6px' }}>
                  <strong>כתובת:</strong> {selected.address}
                </p>
              )}
              {selected.notes && (
                <p style={{ fontSize: '13px', color: '#4a7c74', margin: 0 }}>
                  <strong>הערות:</strong> {selected.notes}
                </p>
              )}
            </div>

            <button
              onClick={() => handleRegisterPayment(selected)}
              style={{
                ...btnStyle('linear-gradient(135deg, #059669, #0d9488)'),
                width: '100%', marginBottom: '10px',
                boxShadow: '0 4px 14px rgba(5,150,105,0.3)',
              }}
            >
              💵 רשום תשלום (₪{selected.price?.toLocaleString()})
            </button>
            {paidMsg && (
              <p style={{
                margin: '0 0 12px', textAlign: 'center', fontSize: '13px', fontWeight: '700',
                color: paidMsg.startsWith('✅') ? '#059669' : '#f43f5e',
              }}>
                {paidMsg}
              </p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                onClick={() => handleWhatsApp(selected.phone)}
                style={{ ...btnStyle('linear-gradient(135deg, #10b981, #059669)'), boxShadow: '0 4px 14px rgba(16,185,129,0.3)' }}
              >
                💬 וואטסאפ
              </button>
              <button
                onClick={() => handleCall(selected.phone)}
                style={{ ...btnStyle('linear-gradient(135deg, #134e4a, #0f766e)'), boxShadow: '0 4px 14px rgba(19,78,74,0.25)' }}
              >
                <Phone size={16} /> התקשר
              </button>
              <button
                onClick={() => handleDelete(selected.id)}
                style={{
                  ...btnStyle('#fff1f2', '#f43f5e'),
                  border: '1px solid #fecdd3',
                  gridColumn: 'span 2',
                }}
              >
                <Trash2 size={16} /> מחק לקוח
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}