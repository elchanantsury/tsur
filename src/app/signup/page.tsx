'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      alert("שגיאה בהרשמה: " + error.message);
      setLoading(false);
      return;
    }

    // שמירת השם בפרופיל
    if (data.user) {
      await supabase
        .from('profiles')
        .update({ name })
        .eq('id', data.user.id);
    }

    alert("נרשמת בהצלחה! ניתן להתחבר.");
    router.push('/login');
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '30px', border: '1px solid #e2e8f0', borderRadius: '16px', background: '#fff' }}>
      <h2 style={{ textAlign: 'center' }}>הרשמה ל-Tzur Clean</h2>

      <input
        type="text"
        placeholder="שם מלא"
        onChange={(e) => setName(e.target.value)}
        style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}
      />
      <input
        type="email"
        placeholder="אימייל"
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}
      />
      <input
        type="password"
        placeholder="סיסמה"
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}
      />

      <button
        onClick={handleSignup}
        disabled={loading}
        style={{ width: '100%', padding: '12px', background: loading ? '#94a3b8' : '#0f172a', color: '#fff', borderRadius: '8px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
      >
        {loading ? 'נרשם...' : 'הירשם'}
      </button>

      <p style={{ textAlign: 'center', marginTop: '15px' }}>
        כבר יש לך חשבון? <a href="/login" style={{ color: '#0070f3' }}>התחבר כאן</a>
      </p>
    </div>
  );
}