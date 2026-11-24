import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useSmartProfileLive } from '@/hooks/useSmartProfileLive';
import { useAdminRole } from '@/hooks/useAdminRole';

const SmartProfilePage = lazy(() => import('./SmartProfilePage'));

/** Flag gate: members see /profile/smart only when smart_profile_live is true; admins always (for review). */
export function SmartProfileRoute() {
  const { live, loading } = useSmartProfileLive();
  const { isAdmin, isLoading } = useAdminRole();
  if (loading || isLoading) return null;
  if (!live && !isAdmin) return <Navigate to="/profile" replace />;
  return (
    <Suspense fallback={null}>
      <SmartProfilePage />
    </Suspense>
  );
}
