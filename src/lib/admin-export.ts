import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

/**
 * Export users to CSV
 */
export async function exportUsersToCSV(options?: {
  filter?: string;
  search?: string;
}): Promise<string> {
  let query = supabase
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      level,
      locked_nctr,
      available_nctr,
      claim_balance,
      wallet_address,
      referral_code,
      created_at,
      updated_at
    `)
    .order('created_at', { ascending: false });

  if (options?.search) {
    query = query.or(`email.ilike.%${options.search}%,full_name.ilike.%${options.search}%`);
  }

  if (options?.filter === 'has_wallet') {
    query = query.not('wallet_address', 'is', null);
  }

  const { data: profiles, error } = await query;
  if (error) throw error;

  // Fetch unified profile data for tier info
  const userIds = profiles?.map(p => p.id) || [];
  const { data: unifiedProfiles } = await supabase
    .from('unified_profiles')
    .select('auth_user_id, tier_override, primary_wallet_address, wallet_verified')
    .in('auth_user_id', userIds);

  const unifiedMap = new Map(
    unifiedProfiles?.map(up => [up.auth_user_id, up]) || []
  );

  // Get tier name from level
  const getTierName = (level: number) => {
    const tiers: Record<number, string> = {
      1: 'Bronze',
      2: 'Silver',
      3: 'Gold',
      4: 'Platinum',
      5: 'Diamond',
    };
    return tiers[level] || 'Level 1';
  };

  const headers = [
    'ID',
    'Email',
    'Name',
    'Tier',
    'Tier Override',
    'Locked NCTR',
    'Available NCTR',
    'Claim Balance',
    'Primary Wallet',
    'Wallet Verified',
    'Referral Code',
    'Created At',
    'Last Active',
  ];

  const rows = profiles?.map(profile => {
    const unified = unifiedMap.get(profile.id);
    return [
      profile.id,
      profile.email || '',
      profile.full_name || '',
      getTierName(profile.level),
      unified?.tier_override || '',
      profile.locked_nctr,
      profile.available_nctr,
      profile.claim_balance,
      unified?.primary_wallet_address || profile.wallet_address || '',
      unified?.wallet_verified ? 'Yes' : 'No',
      profile.referral_code || '',
      format(new Date(profile.created_at), 'yyyy-MM-dd HH:mm'),
      format(new Date(profile.updated_at), 'yyyy-MM-dd HH:mm'),
    ];
  }) || [];

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return csv;
}

/**
 * Export NCTR adjustments to CSV
 */
export async function exportAdjustmentsToCSV(options?: {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
}): Promise<string> {
  let query = supabase
    .from('admin_nctr_adjustments')
    .select(`
      *,
      admin:admin_id (display_name, email),
      user:user_id (display_name, email)
    `)
    .order('created_at', { ascending: false });

  if (options?.startDate) {
    query = query.gte('created_at', options.startDate.toISOString());
  }
  if (options?.endDate) {
    query = query.lte('created_at', options.endDate.toISOString());
  }
  if (options?.userId) {
    query = query.eq('user_id', options.userId);
  }

  const { data: adjustments, error } = await query;
  if (error) throw error;

  const headers = [
    'Date',
    'User Email',
    'User Name',
    'Adjustment Type',
    'Amount',
    'Previous Balance',
    'New Balance',
    'Previous Tier',
    'New Tier',
    'Lock Duration (days)',
    'Lock Expires At',
    'Reason',
    'Admin Note',
    'Notification Sent',
    'Admin Email',
    'Admin Name',
    'Status',
  ];

  const rows = adjustments?.map((adj: any) => [
    format(new Date(adj.created_at), 'yyyy-MM-dd HH:mm'),
    adj.user?.email || '',
    adj.user?.display_name || '',
    adj.adjustment_type,
    adj.amount,
    adj.previous_balance,
    adj.new_balance,
    adj.previous_tier || '',
    adj.new_tier || '',
    adj.lock_duration || '',
    adj.lock_expires_at ? format(new Date(adj.lock_expires_at), 'yyyy-MM-dd') : '',
    adj.reason,
    adj.admin_note || '',
    adj.notification_sent ? 'Yes' : 'No',
    adj.admin?.email || '',
    adj.admin?.display_name || '',
    adj.status || 'completed',
  ]) || [];

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return csv;
}

/**
 * Download CSV file
 */
export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
