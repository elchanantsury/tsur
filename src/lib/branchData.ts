import { BRANCHES_DATA } from '../constants/branches';
import { supabase } from './supabase';

export interface BranchRecord {
  id: number;
  name: string;
  region: string;
  manager: string;
  phone: string;
  cell: string;
  address: string;
  price: number;
}

export interface BranchOverride {
  branch_name: string;
  manager?: string | null;
  phone?: string | null;
  cell?: string | null;
  address?: string | null;
}

export async function fetchBranchOverrides(): Promise<Record<string, BranchOverride>> {
  const { data } = await supabase.from('branch_overrides').select('*');
  const map: Record<string, BranchOverride> = {};
  (data || []).forEach(row => {
    map[row.branch_name] = row;
  });
  return map;
}

export function mergeBranches(overrides: Record<string, BranchOverride>): BranchRecord[] {
  return BRANCHES_DATA.map(b => {
    const o = overrides[b.name];
    if (!o) return b as BranchRecord;
    return {
      ...b,
      manager: o.manager ?? b.manager,
      phone: o.phone ?? b.phone,
      cell: o.cell ?? b.cell,
      address: o.address ?? b.address,
    } as BranchRecord;
  });
}
