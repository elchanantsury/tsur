'use client';
import { useReports } from '../../../context/ReportsContext';

export default function AdminUsersPage() {
  const { user, users, updateUserRole } = useReports();

  // בדיקה אם המשתמש מורשה (וגם מגן מפני טעינה ראשונית)
  if (!user || user.role !== 'admin') return <div>אין הרשאה או שהנתונים נטענים...</div>;

  return (
    <div dir="rtl" style={{ padding: '40px' }}>
      <h1>⚙️ ניהול צוות והרשאות</h1>
      <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f1f5f9' }}>
            <th style={{ padding: '10px' }}>שם</th>
            <th style={{ padding: '10px' }}>תפקיד נוכחי</th>
            <th style={{ padding: '10px' }}>שנה תפקיד</th>
          </tr>
        </thead>
        <tbody>
          {/* הוספת הגנה: אם users לא קיים, נשתמש במערך ריק */}
          {(users || []).map((u: any) => (
            <tr key={u.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '10px' }}>{u.name || 'ללא שם'}</td>
              <td style={{ padding: '10px' }}>{u.role}</td>
              <td style={{ padding: '10px' }}>
                <select 
                  defaultValue={u.role} 
                  onChange={(e) => updateUserRole && updateUserRole(u.id, e.target.value)}
                >
                  <option value="worker">עובד</option>
                  <option value="manager">מנהל</option>
                  <option value="admin">מנהל על</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}