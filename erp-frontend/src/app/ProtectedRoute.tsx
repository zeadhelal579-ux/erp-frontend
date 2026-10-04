import { Navigate, Outlet } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import type { UserRole } from '@/lib/types/api';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

/** حارس مسارات حسب الدور (UI Muting فقط -- الحماية الحقيقية دائمًا [Authorize] في الباك إند) */
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { hasRole } = usePermissions();
  return hasRole(...allowedRoles) ? <Outlet /> : <Navigate to="/" replace />;
}
