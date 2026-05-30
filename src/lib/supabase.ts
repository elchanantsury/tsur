import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// זה הלקוח שיודע לנהל עוגיות בצד הלקוח (הדפדפן)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);