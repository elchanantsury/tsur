'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import AuthLayout, { authButtonStyle, authInputStyle, authLinkStyle } from '../../components/AuthLayout';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
        setChecking(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true);
      }
      setChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUpdate = async () => {
    if (password.length < 6) {
      alert('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }
    if (password !== confirm) {
      alert('הסיסמאות אינן תואמות');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      alert('שגיאה: ' + error.message);
      return;
    }

    alert('הסיסמה עודכנה בהצלחה!');
    router.push('/login');
  };

  if (checking) {
    return (
      <AuthLayout title="איפוס סיסמה" subtitle="טוען...">
        <p style={{ textAlign: 'center', color: '#6aada0' }}>מאמת קישור...</p>
      </AuthLayout>
    );
  }

  if (!ready) {
    return (
      <AuthLayout
        title="קישור לא תקין"
        subtitle="הקישור פג תוקף או כבר נוצל"
        footer={<Link href="/forgot-password" style={authLinkStyle}>בקש קישור חדש</Link>}
      >
        <p style={{ textAlign: 'center', color: '#6aada0', fontSize: '14px' }}>
          פתח שוב את הקישור מהמייל, או בקש איפוס סיסמה מחדש.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="סיסמה חדשה"
      subtitle="בחר סיסמה חדשה לחשבון שלך"
      footer={<Link href="/login" style={authLinkStyle}>חזרה להתחברות</Link>}
    >
      <input
        type="password"
        placeholder="סיסמה חדשה"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={authInputStyle}
        autoFocus
      />
      <input
        type="password"
        placeholder="אימות סיסמה"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
        style={authInputStyle}
      />
      <button
        type="button"
        onClick={handleUpdate}
        disabled={loading}
        style={authButtonStyle(loading)}
      >
        {loading ? 'שומר...' : 'שמור סיסמה חדשה'}
      </button>
    </AuthLayout>
  );
}
