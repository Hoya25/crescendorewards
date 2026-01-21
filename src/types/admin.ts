export type AdminRole = 'super_admin' | 'admin' | 'moderator';

export type AdminPermission =
  | 'rewards_view' | 'rewards_edit' | 'rewards_delete' | 'rewards_create'
  | 'claims_view' | 'claims_process' | 'claims_refund'
  | 'users_view' | 'users_edit' | 'users_ban'
  | 'submissions_view' | 'submissions_approve' | 'submissions_reject'
  | 'sponsors_view' | 'sponsors_edit'
  | 'brands_view' | 'brands_edit'
  | 'settings_view' | 'settings_edit'
  | 'admins_view' | 'admins_manage';

export interface AdminUser {
  id: string;
  user_id: string;
  role: AdminRole;
  permissions: AdminPermission[];
  invited_by?: string;
  invited_at: string;
  is_active: boolean;
  last_login?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: {
    id: string;
    display_name: string;
    email: string;
    avatar_url?: string;
  };
  inviter?: {
    display_name: string;
  };
}

export interface AdminActivityLog {
  id: string;
  admin_user_id: string;
  action: string;
  target_type?: string;
  target_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
  admin?: AdminUser;
}

export const PERMISSION_GROUPS = {
  rewards: {
    label: 'Rewards',
    permissions: [
      { key: 'rewards_view' as const, label: 'View Rewards' },
      { key: 'rewards_create' as const, label: 'Create Rewards' },
      { key: 'rewards_edit' as const, label: 'Edit Rewards' },
      { key: 'rewards_delete' as const, label: 'Delete Rewards' },
    ]
  },
  claims: {
    label: 'Claims',
    permissions: [
      { key: 'claims_view' as const, label: 'View Claims' },
      { key: 'claims_process' as const, label: 'Process Claims' },
      { key: 'claims_refund' as const, label: 'Refund Claims' },
    ]
  },
  users: {
    label: 'Users',
    permissions: [
      { key: 'users_view' as const, label: 'View Users' },
      { key: 'users_edit' as const, label: 'Edit Users' },
      { key: 'users_ban' as const, label: 'Ban/Suspend Users' },
    ]
  },
  submissions: {
    label: 'Submissions',
    permissions: [
      { key: 'submissions_view' as const, label: 'View Submissions' },
      { key: 'submissions_approve' as const, label: 'Approve Submissions' },
      { key: 'submissions_reject' as const, label: 'Reject Submissions' },
    ]
  },
  sponsors: {
    label: 'Sponsors',
    permissions: [
      { key: 'sponsors_view' as const, label: 'View Sponsors' },
      { key: 'sponsors_edit' as const, label: 'Manage Sponsors' },
    ]
  },
  brands: {
    label: 'Brands',
    permissions: [
      { key: 'brands_view' as const, label: 'View Brands' },
      { key: 'brands_edit' as const, label: 'Manage Brands' },
    ]
  },
  settings: {
    label: 'Settings',
    permissions: [
      { key: 'settings_view' as const, label: 'View Settings' },
      { key: 'settings_edit' as const, label: 'Edit Settings' },
    ]
  },
  admins: {
    label: 'Admin Management',
    permissions: [
      { key: 'admins_view' as const, label: 'View Admins' },
      { key: 'admins_manage' as const, label: 'Manage Admins' },
    ]
  },
} as const;

export const ROLE_PRESETS: Record<AdminRole, { label: string; description: string; defaultPermissions: AdminPermission[] }> = {
  super_admin: {
    label: 'Super Admin',
    description: 'Full access to everything. Can manage other admins.',
    defaultPermissions: [],
  },
  admin: {
    label: 'Admin',
    description: 'Can manage most content but cannot manage other admins.',
    defaultPermissions: [
      'rewards_view', 'rewards_edit', 'rewards_create',
      'claims_view', 'claims_process',
      'users_view', 'users_edit',
      'submissions_view', 'submissions_approve', 'submissions_reject',
      'sponsors_view', 'sponsors_edit',
      'brands_view', 'brands_edit',
      'settings_view',
    ],
  },
  moderator: {
    label: 'Moderator',
    description: 'Limited access. Can view and process claims and submissions.',
    defaultPermissions: [
      'rewards_view',
      'claims_view', 'claims_process',
      'users_view',
      'submissions_view', 'submissions_approve', 'submissions_reject',
    ],
  },
};
