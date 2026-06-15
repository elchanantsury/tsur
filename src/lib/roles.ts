export type UserRole = 'admin' | 'manager' | 'worker' | 'employee' | string;

/** מנהל על + מנהל — לא עובד */
export function isManagerOrAdmin(role?: string | null): boolean {
  return role === 'admin' || role === 'manager';
}

export function isAdmin(role?: string | null): boolean {
  return role === 'admin';
}
