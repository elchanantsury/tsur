import { ReactNode } from 'react';

type AuthLayoutProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export default function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'linear-gradient(160deg, #ecfdf5 0%, #f0fdf9 40%, #f8fffe 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: '-120px',
        left: '-80px',
        width: '320px',
        height: '320px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-100px',
        right: '-60px',
        width: '280px',
        height: '280px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(13,148,136,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: '#ffffff',
        borderRadius: '24px',
        padding: '36px 32px 32px',
        boxShadow: '0 8px 40px rgba(16,185,129,0.12), 0 2px 8px rgba(0,0,0,0.04)',
        border: '1px solid #d1fae5',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '24px',
          padding: '20px 16px',
          background: 'linear-gradient(135deg, #f0fdf9 0%, #ecfdf5 100%)',
          borderRadius: '16px',
          border: '1px solid #d1fae5',
        }}>
          <img
            src="/logo.jpg"
            alt="Tzur Clean"
            style={{
              display: 'block',
              width: '100%',
              maxWidth: '300px',
              height: 'auto',
              objectFit: 'contain',
              borderRadius: '12px',
            }}
          />
        </div>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{
            margin: 0,
            fontSize: '22px',
            fontWeight: '800',
            color: '#0d2420',
            letterSpacing: '-0.02em',
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{
              margin: '8px 0 0',
              fontSize: '14px',
              color: '#6aada0',
              fontWeight: '500',
            }}>
              {subtitle}
            </p>
          )}
        </div>

        {children}

        {footer && (
          <div style={{
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid #ecfdf5',
            textAlign: 'center',
            fontSize: '14px',
            color: '#4a7c74',
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export const authInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px 16px',
  marginBottom: '12px',
  borderRadius: '12px',
  border: '1px solid #d1fae5',
  background: '#f8fffe',
  fontSize: '15px',
  fontFamily: 'inherit',
  color: '#0d2420',
  outline: 'none',
  boxSizing: 'border-box',
};

export const authButtonStyle = (loading: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '14px',
  marginTop: '4px',
  background: loading
    ? '#94a3b8'
    : 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)',
  color: '#fff',
  borderRadius: '12px',
  border: 'none',
  fontSize: '15px',
  fontWeight: '700',
  cursor: loading ? 'not-allowed' : 'pointer',
  fontFamily: 'inherit',
  boxShadow: loading ? 'none' : '0 4px 14px rgba(16,185,129,0.35)',
});

export const authLinkStyle: React.CSSProperties = {
  color: '#0d9488',
  fontWeight: '700',
  textDecoration: 'none',
};
