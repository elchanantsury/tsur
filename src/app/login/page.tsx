'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import AuthLayout, { authButtonStyle, authInputStyle, authLinkStyle } from '../../components/AuthLayout';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert('שגיאה בהתחברות: ' + error.message);
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
    <AuthLayout
      title="ברוכים השבים"
      subtitle="התחברות למערכת Tzur Clean"
      footer={
        <>
          אין לך חשבון עדיין?{' '}
          <Link href="/signup" style={authLinkStyle}>הירשם כאן</Link>
        </>
      }
    >
      <input
        type="email"
        placeholder="אימייל"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={authInputStyle}
      />
      <input
        type="password"
        placeholder="סיסמה"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
        style={authInputStyle}
      />

      <p style={{ textAlign: 'left', margin: '0 0 12px' }}>
        <Link href="/forgot-password" style={{ ...authLinkStyle, fontSize: '13px' }}>
          שכחת סיסמה?
        </Link>
      </p>

      <button
        type="button"
        onClick={handleLogin}
        disabled={loading}
        style={authButtonStyle(loading)}
      >
        {loading ? 'מתחבר...' : 'התחבר'}
      </button>
    </AuthLayout>
  );
}
