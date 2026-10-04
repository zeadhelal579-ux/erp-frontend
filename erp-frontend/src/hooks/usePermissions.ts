import { useAuth } from './useAuth';
import type { UserRole } from '@/lib/types/api';

export function usePermissions() {
  const { user } = useAuth();

  function hasRole(...roles: UserRole[]) {
    if (!user) return false;
    if (user.role === 'SuperAdmin') return true;
    return roles.includes(user.role);
  }

  return { hasRole, role: user?.role ?? null };
}
