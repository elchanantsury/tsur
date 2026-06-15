'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import AuthLayout, { authButtonStyle, authInputStyle, authLinkStyle } from '../../components/AuthLayout';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    const trimmedEmail = email.trim();
    if (!name.trim() || !trimmedEmail || !password) {
      alert('יש למלא שם, אימייל וסיסמה');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: { name: name.trim() },
      },
    });

    if (error) {
      alert('שגיאה בהרשמה: ' + error.message);
      setLoading(false);
      return;
    }

    if (data.user?.identities?.length === 0) {
      alert('כתובת האימייל כבר רשומה במערכת. נסה להתחבר או לאפס סיסמה.');
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase
        .from('profiles')
        .update({ name: name.trim() })
        .eq('id', data.user.id);
    }

    setLoading(false);

    // אין session = נדרש אימות במייל לפני התחברות
    if (!data.session) {
      setAwaitingVerification(true);
      return;
    }

    router.push('/login');
  };

  if (awaitingVerification) {
    return (
      <AuthLayout
        title="כמעט סיימנו"
        subtitle="נשאר לאמת את האימייל"
        footer={
          <Link href="/login" style={authLinkStyle}>לדף ההתחברות</Link>
        }
      >
        <div style={{
          textAlign: 'center', padding: '20px 16px', background: '#ecfdf5',
          borderRadius: '14px', border: '1px solid #a7f3d0', color: '#047857',
          fontSize: '14px', lineHeight: 1.65,
        }}>
          <p style={{ fontSize: '32px', margin: '0 0 12px' }}>✉️</p>
          <p style={{ margin: '0 0 10px', fontWeight: '800', fontSize: '16px' }}>
            שלחנו אליך מייל לאימות
          </p>
          <p style={{ margin: '0 0 8px' }}>
            נפתח קישור במייל שנשלח ל:
          </p>
          <p style={{ margin: '0 0 14px', direction: 'ltr', fontWeight: '700' }}>
            {email.trim()}
          </p>
          <p style={{ margin: 0, fontSize: '13px', color: '#6aada0' }}>
            אחרי האימות תוכל להתחבר למערכת.
            <br />
            לא רואה את המייל? בדוק גם בתיקיית ספאם.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="הצטרפות למערכת"
      subtitle="יצירת חשבון חדש ב-Tzur Clean"
      footer={
        <>
          כבר יש לך חשבון?{' '}
          <Link href="/login" style={authLinkStyle}>התחבר כאן</Link>
        </>
      }
    >
      <input
        type="text"
        placeholder="שם מלא"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={authInputStyle}
      />
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
        onKeyDown={(e) => e.key === 'Enter' && handleSignup()}
        style={authInputStyle}
      />

      <p style={{ fontSize: '12px', color: '#94c9bf', margin: '0 0 12px', lineHeight: 1.5 }}>
        לאחר ההרשמה יישלח אליך מייל לאימות החשבון.
      </p>

      <button
        type="button"
        onClick={handleSignup}
        disabled={loading}
        style={authButtonStyle(loading)}
      >
        {loading ? 'נרשם...' : 'הירשם'}
      </button>
    </AuthLayout>
  );
}
