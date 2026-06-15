import { supabase } from './supabase';

export type NotificationType = 'branch_closed' | 'sos' | 'manager_note' | 'system';
export type TargetRole = 'admin' | 'manager' | 'both';

function appBaseUrl(): string {
  if (typeof window !== 'undefined') return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL || 'https://tsur.vercel.app';
}

export async function createAppNotification(opts: {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  branch_name?: string;
  target_role?: TargetRole;
  created_by_name?: string;
  sendSms?: boolean;
}) {
  const path = opts.link?.startsWith('/') ? opts.link : `/${opts.link || ''}`.replace('//', '/') || '/';
  const fullLink = `${appBaseUrl()}${path}`;

  const { error } = await supabase.from('app_notifications').insert([{
    type: opts.type,
    title: opts.title,
    message: opts.message,
    link: path,
    branch_name: opts.branch_name || null,
    target_role: opts.target_role ?? 'both',
    created_by_name: opts.created_by_name || null,
  }]);

  if (error) {
    console.error('notification insert:', error.message);
  }

  if (opts.sendSms) {
    try {
      await fetch('/api/notify-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `${opts.title}\n${opts.message}\n${fullLink}`,
        }),
      });
    } catch (e) {
      console.error('SMS send failed', e);
    }
  }

  return !error;
}

export function targetRoleForSender(senderRole: string): TargetRole {
  return senderRole === 'admin' ? 'manager' : 'admin';
}

export const NOTE_CATEGORIES: { value: string; label: string }[] = [
  { value: 'general', label: 'הערה כללית' },
  { value: 'urgent', label: 'דחוף' },
  { value: 'update', label: 'עדכון סטטוס' },
  { value: 'request', label: 'בקשה / משימה' },
  { value: 'info', label: 'מידע' },
];
