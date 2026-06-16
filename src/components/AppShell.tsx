'use client';
import { useState, useEffect, ReactNode } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';

const MOBILE_BREAKPOINT = 768;

export default function AppShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const update = () => {
      const mobile = mq.matches;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const closeSidebar = () => setSidebarOpen(false);
  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, sidebarOpen]);

  return (
    <div className={`app-shell ${isMobile && sidebarOpen ? 'app-shell--menu-open' : ''}`}>
      <Sidebar
        isOpen={sidebarOpen}
        isMobile={isMobile}
        onClose={closeSidebar}
        onNavigate={isMobile ? closeSidebar : undefined}
      />

      {isMobile && sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="סגור תפריט"
          onClick={closeSidebar}
        />
      )}

      <NotificationBell />

      <button
        type="button"
        className="sidebar-toggle"
        onClick={toggleSidebar}
        aria-label={sidebarOpen ? 'הסתר תפריט' : 'הצג תפריט'}
        aria-expanded={sidebarOpen}
      >
        {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      <main className="app-main">
        {children}
      </main>
    </div>
  );
}
