import { BRANCHES_DATA } from '../constants/branches';
import AdminGreeting from '../components/AdminGreeting'; // הוספנו את הייבוא לכאן

export default function Dashboard() {
  const totalBranches = BRANCHES_DATA.length;

  return (
    <div dir="rtl">
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: '0' }}>
          שלום, <span style={{ color: '#0ea5e9' }}>TSURClean</span> 👋
        </h1>
        <p style={{ color: '#64748b', marginTop: '8px' }}>הנה תמונת מצב מסונכרנת של העסק.</p>
      </header>

      {/* כאן הוספנו את הרכיב שיבדוק אם אתה מנהל ויציג הודעה */}
      <AdminGreeting />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        <div style={statStyle}>
          <p style={labelStyle}>סניפי אפריל במערכת</p>
          <p style={valueStyle}>{totalBranches}</p>
        </div>
        <div style={statStyle}>
          <p style={labelStyle}>מצב מערכת</p>
          <p style={{ ...valueStyle, color: '#10b981', fontSize: '18px' }}>מחובר ומסונכרן ✅</p>
        </div>
      </div>
    </div>
  );
}

const statStyle = { 
  padding: '24px', 
  backgroundColor: '#f8fafc', 
  borderRadius: '20px', 
  border: '1px solid #e2e8f0' 
};

const labelStyle = { 
  margin: 0, 
  fontSize: '14px', 
  color: '#64748b', 
  fontWeight: 'bold' 
};

const valueStyle = { 
  margin: '10px 0 0 0', 
  fontSize: '36px', 
  fontWeight: '800', 
  color: '#0f172a' 
};