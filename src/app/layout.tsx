'use client';
import { usePathname } from 'next/navigation';
import AppShell from '../components/AppShell';
import './globals.css';
import { ReportsProvider } from '../context/ReportsContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password';

  return (
    <html lang="he" dir="rtl" style={{ background: '#f8fffe' }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body style={{
        margin: 0, padding: 0,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        background: '#f8fffe', color: '#0d2420', minHeight: '100vh',
      }}>
        <ReportsProvider>
          {isAuthPage ? (
            <main style={{ background: '#f8fffe', minHeight: '100vh' }}>{children}</main>
          ) : (
            <AppShell>{children}</AppShell>
          )}
        </ReportsProvider>
      </body>
    </html>
  );
}