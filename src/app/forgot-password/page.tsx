'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import AuthLayout, { authButtonStyle, authInputStyle, authLinkStyle } from '../../components/AuthLayout';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      alert('יש להזין כתובת אימייל');
      return;
    }

    setLoading(true);
    const redirectTo = `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, { redirectTo });

    setLoading(false);

    if (error) {
      alert('שגיאה: ' + error.message);
      return;
    }

    setSent(true);
  };

  return (
    <AuthLayout
      title={sent ? 'נשלח למייל' : 'שכחת סיסמה?'}
      subtitle={
        sent
          ? 'בדוק את תיבת הדואר (גם ספאם)'
          : 'נשלח לך קישור לאיפוס הסיסמה'
      }
      footer={
        <Link href="/login" style={authLinkStyle}>חזרה להתחברות</Link>
      }
    >
      {sent ? (
        <div style={{
          textAlign: 'center', padding: '16px', background: '#ecfdf5',
          borderRadius: '12px', border: '1px solid #a7f3d0', color: '#047857',
          fontSize: '14px', lineHeight: 1.6,
        }}>
          <p style={{ margin: '0 0 8px', fontWeight: '700' }}>✉️ נשלח קישור ל:</p>
          <p style={{ margin: 0, direction: 'ltr' }}>{email.trim()}</p>
          <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#6aada0' }}>
            לחץ על הקישור במייל ובחר סיסמה חדשה.
          </p>
        </div>
      ) : (
        <>
          <p style={{
            fontSize: '13px', color: '#6aada0', margin: '0 0 12px', lineHeight: 1.5,
          }}>
            לא ניתן לשלוח את הסיסמה הישנה (היא מוצפנת). נשלח קישור בטוח ליצירת סיסמה חדשה.
          </p>
          <input
            type="email"
            placeholder="האימייל שלך"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleReset()}
            style={authInputStyle}
            autoFocus
          />
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            style={authButtonStyle(loading)}
          >
            {loading ? 'שולח...' : 'שלח קישור לאיפוס'}
          </button>
        </>
      )}
    </AuthLayout>
  );
}
