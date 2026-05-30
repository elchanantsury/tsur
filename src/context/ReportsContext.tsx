'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ReportsContext = createContext<any>(null);

export function ReportsProvider({ children }: { children: React.ReactNode }) {
  const [reports, setReports] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function fetchCurrentUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!error && data) setUser(data);
    }

    fetchCurrentUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchCurrentUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user?.role !== 'admin') return;

    async function fetchUsers() {
      const { data, error } = await supabase.from('profiles').select('*');
      if (!error && data) setUsers(data);
    }

    fetchUsers();
  }, [user]);

  useEffect(() => {
    async function fetchReports() {
      const { data, error } = await supabase.from('reports').select('*');
      if (error) {
        console.error("שגיאה בטעינת דוחות:", error.message);
      } else {
        setReports(data || []);
      }
    }
    fetchReports();
  }, []);

  const updateUserRole = async (userId: string, newRole: string) => {
    if (user?.role !== 'admin') return;

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
  };

  const addReport = async (report: any) => {
    const reportData = { ...report };
    if (reportData.signature) {
      reportData.signature_url = reportData.signature;
      delete reportData.signature;
    }

    const { data, error } = await supabase
      .from('reports')
      .insert([reportData])
      .select();

    if (error) {
      console.error("שגיאת סופרבייס:", error.message);
    } else if (data) {
      setReports(prev => [...prev, data[0]]);
    }
  };

  return (
    <ReportsContext.Provider value={{ reports, addReport, user, setUser, users, updateUserRole }}>
      {children}
    </ReportsContext.Provider>
  );
}

export const useReports = () => useContext(ReportsContext);