import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useUnifiedUser } from '@/contexts/UnifiedUserContext';
import { AdminUser, AdminPermission } from '@/types/admin';

export function useAdminRole() {
  const { profile } = useUnifiedUser();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Legacy compatibility - also check user_roles table
  const [legacyAdmin, setLegacyAdmin] = useState(false);

  const fetchAdminStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // First check the new admin_users table via unified_profiles
      if (profile?.id) {
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', profile.id)
          .eq('is_active', true)
          .maybeSingle();

        if (!adminError && adminData) {
          // Fetch user details separately
          const { data: userData } = await supabase
            .from('unified_profiles')
            .select('id, display_name, email, avatar_url')
            .eq('id', adminData.user_id)
            .single();

          const { data: inviterData } = adminData.invited_by ? await supabase
            .from('unified_profiles')
            .select('display_name')
            .eq('id', adminData.invited_by)
            .single() : { data: null };

          setAdminUser({
            ...adminData,
            permissions: adminData.permissions || [],
            user: userData || undefined,
            inviter: inviterData || undefined,
          } as AdminUser);
          setIsLoading(false);
          return;
        }
      }

      // Fallback to legacy user_roles table
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (roleData) {
          setLegacyAdmin(true);
          // Create a synthetic admin user for legacy admins with full permissions
          setAdminUser({
            id: 'legacy',
            user_id: profile?.id || user.id,
            role: 'super_admin',
            permissions: [],
            invited_at: new Date().toISOString(),
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch admin status');
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchAdminStatus();
  }, [fetchAdminStatus]);

  const isAdmin = !!adminUser || legacyAdmin;
  const isSuperAdmin = adminUser?.role === 'super_admin' || legacyAdmin;
  const role = adminUser?.role;

  const hasPermission = useCallback((permission: AdminPermission): boolean => {
    if (!adminUser && !legacyAdmin) return false;
    if (legacyAdmin || adminUser?.role === 'super_admin') return true;
    return adminUser?.permissions?.includes(permission) ?? false;
  }, [adminUser, legacyAdmin]);

  const hasAnyPermission = useCallback((permissions: AdminPermission[]): boolean => {
    return permissions.some(p => hasPermission(p));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissions: AdminPermission[]): boolean => {
    return permissions.every(p => hasPermission(p));
  }, [hasPermission]);

  const logActivity = useCallback(async (
    action: string,
    targetType?: string,
    targetId?: string,
    details?: Record<string, any>
  ) => {
    if (!adminUser || adminUser.id === 'legacy') return;

    try {
      await supabase.from('admin_activity_log').insert({
        admin_user_id: adminUser.id,
        action,
        target_type: targetType,
        target_id: targetId,
        details,
      });
    } catch (err) {
      console.error('Failed to log admin activity:', err);
    }
  }, [adminUser]);

  return {
    adminUser,
    isAdmin,
    isSuperAdmin,
    role,
    permissions: adminUser?.permissions ?? [],
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    logActivity,
    isLoading,
    loading: isLoading, // Legacy compatibility
    error,
    refresh: fetchAdminStatus,
  };
}
