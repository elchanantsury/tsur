'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase'; // מוודא שאנחנו משתמשים בלקוח שיצרנו

export default function AdminGreeting() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      // 1. קבלת המשתמש המחובר
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // 2. פנייה לטבלת profiles כדי לבדוק את התפקיד
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        setRole(profile?.role || 'employee'); // אם לא מצאנו, נגדיר כעובד רגיל
      }
      setLoading(false);
    };

    checkRole();
  }, []);

  if (loading) return <p>בודק הרשאות...</p>;

  // אם המשתמש הוא אדמין, נציג לו הודעה
  if (role === 'admin') {
    return (
      <div style={{ padding: '10px', background: '#dcfce7', color: '#166534', borderRadius: '8px', margin: '10px 0' }}>
        שלום אדמין יקר! יש לך גישה מלאה למערכת.
      </div>
    );
  }

  // אם זה סתם משתמש
  return null; 
}