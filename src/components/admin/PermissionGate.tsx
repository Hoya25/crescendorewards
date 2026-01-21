import { ReactNode } from 'react';
import { useAdminRole } from '@/hooks/useAdminRole';
import { AdminPermission } from '@/types/admin';

interface PermissionGateProps {
  permission?: AdminPermission;
  permissions?: AdminPermission[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGate({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isSuperAdmin } = useAdminRole();

  // Super admins always have access
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // Check single permission
  if (permission) {
    return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
  }

  // Check multiple permissions
  if (permissions && permissions.length > 0) {
    const hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
    return hasAccess ? <>{children}</> : <>{fallback}</>;
  }

  // No permissions specified, allow access
  return <>{children}</>;
}
