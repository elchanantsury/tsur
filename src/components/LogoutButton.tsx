'use client';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login'); // אחרי התנתקות, נחזיר לדף ההתחברות
  };

  return (
    <button 
      onClick={handleLogout}
      style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
    >
      התנתק
    </button>
  );
}