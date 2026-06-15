// src/constants/branches.ts

export const REGION_ORDER = ['צפון', 'מרכז', 'ירושלים', 'דרום'] as const;

export type BranchRegion = (typeof REGION_ORDER)[number];

export const REGION_STYLES: Record<BranchRegion, { bg: string; border: string; color: string; icon: string }> = {
  צפון: { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8', icon: '🧭' },
  מרכז: { bg: '#ecfdf5', border: '#a7f3d0', color: '#047857', icon: '🏙️' },
  ירושלים: { bg: '#faf5ff', border: '#e9d5ff', color: '#7c3aed', icon: '🕌' },
  דרום: { bg: '#fff7ed', border: '#fed7aa', color: '#c2410c', icon: '☀️' },
};

export function groupBranchesByRegion<T extends { region: string }>(branches: T[]) {
  return REGION_ORDER.map(region => ({
    region,
    branches: branches.filter(b => b.region === region),
  })).filter(g => g.branches.length > 0);
}

export const BRANCHES_DATA = [
  // --- מרכז ---
  { id: 1, region: "מרכז", name: "דיזינגוף סנטר", manager: "אור פרץ", phone: "077-9801701", cell: "052-2842088", address: "דיזינגוף 45, תל אביב", price: 1000 },
  { id: 2, region: "מרכז", name: "קניון עזריאלי איילון", manager: "גלית פורת", phone: "077-9801702", cell: "054-4574744", address: "דרך אבא הלל 301 רמת גן", price: 1000 },
  { id: 7, region: "מרכז", name: "קניון השרון נתניה", manager: "יונה סולומונוב", phone: "077-9801707", cell: "053-9594402", address: "הרצל 60, נתניה", price: 1000 },
  { id: 8, region: "מרכז", name: "קניון עופר רמת אביב", manager: "לריסה אליס מאירוביץ'", phone: "077-9801708", cell: "054-5609421", address: "אינשטיין 40, תל אביב", price: 1000 },
  { id: 12, region: "מרכז", name: "קניון עזריאלי חולון", manager: "קלימובוביץ' ליה ברט", phone: "077-9801712", cell: "054-7550971", address: "גולדה מאיר 7, חולון", price: 1000 },
  { id: 13, region: "מרכז", name: "קניון ערים כפר סבא", manager: "דורית בידס", phone: "077-9801713", cell: "054-5609413", address: "ויצמן 17, קניון ערים כפר סבא", price: 1000 },
  { id: 16, region: "מרכז", name: "קניון בת ים", manager: "מגי בן דוד", phone: "077-9801716", cell: "052-3751386", address: "יוספטל 92 קניון בת ים", price: 1000 },
  { id: 18, region: "מרכז", name: "קניון אובנת - פתח תקווה", manager: "ליאת איזנטל", phone: "077-9801718", cell: "054-4704843", address: "ז'בוטינסקי 72, קניון אובנת פ.תקווה", price: 1000 },
  { id: 20, region: "מרכז", name: "קניון שבעת הכוכבים", manager: "אניסה ברלין", phone: "077-9801720", cell: "052-4887778", address: "רח' קניון שבעת הכוכבים 8 הרצליה", price: 1000 },
  { id: 21, region: "מרכז", name: "קניון עופר רחובות", manager: "ויקטוריה כץ", phone: "077-9801721", cell: "052-6979918", address: "בילו 2, רחובות", price: 1000 },
  { id: 23, region: "מרכז", name: "קניון גבעתיים", manager: "יניב עבאדי", phone: "077-9801723", cell: "054-3951982", address: "דרך יצחק רבין 53,גבעתיים", price: 1000 },
  { id: 24, region: "מרכז", name: "קניון הזהב ראשל'צ", manager: "איציק אמיר", phone: "077-9801724", cell: "054-5967930", address: "סחרוב 21 א.ת החדש ראשל'צ קניון הזהב", price: 1000 },
  { id: 34, region: "מרכז", name: "קניון עופר לב חדרה", manager: "ורה לוי", phone: "077-9801734", cell: "054-6879767", address: "רוטשילד 40, קניון חדרה", price: 1000 },
  { id: 43, region: "מרכז", name: "קניון עיר ימים נתניה", manager: "גלינה פשנקו", phone: "077-9801743", cell: "050-9944363", address: "בני ברמן 2, נתניה", price: 1000 },
  { id: 45, region: "מרכז", name: "ג'ינדי", manager: "קובי סמולר", phone: "077-9801745", cell: "054-5609408", address: "החשמונאים 10 ת'א יפו", price: 1000 },
  { id: 46, region: "מרכז", name: "קניון ראשונים", manager: "צוות ניהול", phone: "077-9801746", cell: "-", address: "שדרות נים 2 ראשל'צ", price: 1000 },
  { id: 47, region: "מרכז", name: "הוד השרון - מרגליות", manager: "נירית כהן", phone: "077-9801747", cell: "054-5609411", address: "ז'בוטינסקי 3, הוד השרון", price: 1000 },
  { id: 53, region: "מרכז", name: "טירה", manager: "רינאא מנסור", phone: "077-9801753", cell: "058-6318171", address: "קניון seven טירה", price: 1000 },
  { id: 56, region: "מרכז", name: "רמלה", manager: "מאיה אליאב", phone: "9801756-077", cell: "052-4637181", address: "שדרות דוד רזיאל 1, רמלה", price: 1000 },

  // --- צפון ---
  { id: 5, region: "צפון", name: "קניון עופר הקריון", manager: "יוליה פיסמן", phone: "077-9801705", cell: "052-7489904", address: "דרך עכו 192, קרית ביאליק", price: 1000 },
  { id: 9, region: "צפון", name: "קניון עזריאלי חיפה", manager: "אור פרץ", phone: "077-9801709", cell: "054-3033093", address: "פלמון 4, קניון חיפה", price: 1000 },
  { id: 17, region: "צפון", name: "גרנד חיפה", manager: "יוליה מיכלו", phone: "077-9801717", cell: "052-8988032", address: "דרך שמחה גולן 54, גרנד חיפה", price: 1000 },
  { id: 25, region: "צפון", name: "מרכז ביג כרמיאל", manager: "כריסטין מחולי", phone: "077-9801725", cell: "054-3122058", address: "מעלה כמון 2 אזור תעשייה כרמיאל", price: 1000 },
  { id: 27, region: "צפון", name: "רחוב הנשיא עפולה", manager: "קטיה", phone: "077-9801727", cell: "054-6401849", address: "הנשיא 13 עפולה", price: 1000 },
  { id: 30, region: "צפון", name: "ביג פאשן דנילוף טבריה", manager: "ניקול שמיס", phone: "077-9801730", cell: "053-3066923", address: "ביג פאשן דנילוף טבריה, יהודה הלוי 1", price: 1000 },
  { id: 33, region: "צפון", name: "ביג פאשן נצרת", manager: "קטיה", phone: "077-9801733", cell: "054-5609433", address: "תופיק זאיד 53 מתחם ביג", price: 1000 },
  { id: 41, region: "צפון", name: "קניון שער הצפון", manager: "אנג'לה ספקטור", phone: "077-9801741", cell: "054-7625305", address: "דרך חיפה 30, קניון שער הצפון אקאקה", price: 1000 },
  { id: 48, region: "צפון", name: "ביג פאשן ירכא", manager: "מנאר אסעד", phone: "077-9801748", cell: "050-9944363", address: "ביג פאשן אאוטלט - כפר ירכא", price: 1000 },
  { id: 51, region: "צפון", name: "אום אל פחם", manager: "חולוד ספייה", phone: "077-9801751", cell: "052-7429111", address: "קניון seven", price: 1000 },
  { id: 54, region: "צפון", name: "נהריה", manager: "סיון", phone: "077-9801754", cell: "052-6083988", address: "קניון ארנה", price: 1000 },
  { id: 58, region: "צפון", name: "טמרה", manager: "אירנה דוידוב", phone: "077-9801758", cell: "050-9331433", address: "טמרה", price: 1000 },

  // --- ירושלים ---
  { id: 3, region: "ירושלים", name: "קניון עזריאלי מלחה", manager: "דינה אבו טור", phone: "077-9801703", cell: "054-8993966", address: "אגודת הספורט בית'ר 1 ירושלים", price: 1000 },
  { id: 19, region: "ירושלים", name: "יפי-ירושלים", manager: "אלה דחטיאר", phone: "077-9801719", cell: "052-6785629", address: "יפו 35 ירושלים", price: 1000 },
  { id: 28, region: "ירושלים", name: "שדרות ממילא", manager: "מוסא אדויאת", phone: "077-9801728", cell: "052-4101417", address: "שלמה המלך 9 קניון ממילא", price: 1000 },
  { id: 31, region: "ירושלים", name: "קניון עזריאלי מודיעין", manager: "אנה מכליין", phone: "077-9801731", cell: "054-5381395", address: "לב העיר 2, קניון מודיעין", price: 1000 },
  { id: 44, region: "ירושלים", name: "קניון מבשרת", manager: "מרינה בורוכוביץ", phone: "077-9801744", cell: "054-6543426", address: "החוצבים 10 מבשרת ציון", price: 1000 },
  { id: 50, region: "ירושלים", name: "בית שמש", manager: "ולריה פודרוב", phone: "077-9801750", cell: "054-5342324", address: "קניון ביג פאשן שדרות יגאל אלון 3, בית שמש", price: 1000 },

  // --- דרום ---
  { id: 4, region: "דרום", name: "קניון עזריאלי הנגב", manager: "סיגל דדו", phone: "077-9801704", cell: "052-6737473", address: "צומת אלי כהן באר שבע", price: 1000 },
  { id: 6, region: "דרום", name: "קניון מול הים", manager: "אסנת אטיאס", phone: "077-9801706", cell: "052-2420298", address: "אילת", price: 1000 },
  { id: 22, region: "דרום", name: "קניון סי מול אשדוד", manager: "נטלי אלטמן", phone: "077-9801722", cell: "052-5260560", address: "הגדוד העברי 6, קניון סימול אשדוד", price: 1000 },
  { id: 38, region: "דרום", name: "קניון אייס מול אילת", manager: "איילת חיים", phone: "077-9801738", cell: "053-5580308", address: "קניון הקרח אילת", price: 1000 },
  { id: 39, region: "דרום", name: "עופר גרנד קניון ב\"ש", manager: "אלינה זרצקי", phone: "077-9801739", cell: "050-9935991", address: "שדרות טוביהו דלד 125, גרנד קניון ב\"ש", price: 1000 },
  { id: 42, region: "דרום", name: "ביג פאשן אשדוד", manager: "נטלי אלטמן", phone: "077-9801742", cell: "052-5260560", address: "דרך אריאל שרון 1, אשדוד", price: 1000 },
  { id: 49, region: "דרום", name: "אשקלון", manager: "אירמה זיו", phone: "077-9801749", cell: "053-7389021", address: "קניון גירון, שדרות דוד בן גוריון 21, אשקלון", price: 1000 },
  { id: 52, region: "דרום", name: "אילת טיילת", manager: "סלאח חגאזי", phone: "077-9801752", cell: "052-2094166", address: "תרשיש 8, אילת", price: 1000 },
  { id: 57, region: "דרום", name: "דימונה", manager: "עליה ביטון", phone: "077-9801757", cell: "054-2877293", address: "כביש 25 פרץ סנטר דימונה", price: 1000 }
];