'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert("שגיאה בהתחברות: " + error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push('/');
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '30px', border: '1px solid #e2e8f0', borderRadius: '16px', background: '#fff' }}>
      <h2 style={{ textAlign: 'center' }}>התחברות ל-Tzur Clean</h2>

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
        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
        style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}
      />

      <button
        onClick={handleLogin}
        disabled={loading}
        style={{ width: '100%', padding: '12px', background: loading ? '#94a3b8' : '#0f172a', color: '#fff', borderRadius: '8px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
      >
        {loading ? 'מתחבר...' : 'התחבר'}
        <p style={{ textAlign: 'center', marginTop: '20px' }}>
  אין לך חשבון עדיין? <a href="/signup" style={{ color: '#0070f3', textDecoration: 'underline' }}>הירשם כאן</a>
</p>
      </button>
    </div>
  );
}