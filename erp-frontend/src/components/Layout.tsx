import clsx from 'clsx';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Boxes,
  Factory,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  PackageX,
  Search,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { isMockMode } from '@/lib/api-client';
import type { UserRole } from '@/lib/types/api';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
}

// ==========================================================================
// القائمة دي بتعكس صلاحيات [Authorize] الفعلية في الكونترولرز، مش جدول 5.5 في
// المستند المعماري الأصلي فقط. الفرق الوحيد المتعمَّد: المدير العام (GeneralManager)
// بيشوف هنا 7 عناصر (مش 5 زي التصميم المعتمد على Stitch) لأن الباك إند فعليًا
// بيسمح له بقراءة Inventory و Production (GET /store/materials و GET
// /production/batches الاتنين معمول عليهم GeneralManager في الـ [Authorize])،
// وده متوافق مع رؤية المشروع (02_Project_Vision.md): "رؤية كاملة (Read-Only)
// على كل ما سبق". راجع قسم "فجوات مكتشفة" في التقرير المرفق.
// ==========================================================================
const NAV_ITEMS: NavItem[] = [
  { to: '/inventory', label: 'Inventory', icon: Boxes, roles: ['Storekeeper', 'GeneralManager'] },
  { to: '/production', label: 'Production', icon: Factory, roles: ['ProductionManager', 'GeneralManager'] },
  { to: '/lab', label: 'Lab / QC', icon: FlaskConical, roles: ['LabTech', 'GeneralManager'] },
  { to: '/approvals', label: 'Approvals', icon: ShieldCheck, roles: ['QualityManager'] },
  {
    to: '/quarantine',
    label: 'Quarantine & Scrap',
    icon: PackageX,
    roles: ['QualityManager', 'GeneralManager'],
  },
  { to: '/shipping', label: 'Shipping', icon: Truck, roles: ['Storekeeper', 'GeneralManager'] },
  { to: '/overview', label: 'Overview', icon: LayoutDashboard, roles: ['GeneralManager'] },
  { to: '/traceability', label: 'Traceability', icon: Search, roles: ['GeneralManager'] },
];

const ROLE_LABELS: Record<UserRole, string> = {
  SuperAdmin: 'Super Admin',
  Storekeeper: 'Storekeeper',
  ProductionManager: 'Production Manager',
  LabTech: 'Lab Technician',
  QualityManager: 'Quality Manager',
  GeneralManager: 'General Manager',
};

export function AppLayout() {
  const { user, logout } = useAuth();

  const visibleItems = NAV_ITEMS.filter(
    (item) => user?.role === 'SuperAdmin' || (user && item.roles.includes(user.role))
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
        <div className="flex items-center gap-2 border-b border-gray-200 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            MES
          </div>
          <span className="truncate font-semibold text-gray-800">Production Management</span>
        </div>

        {isMockMode && (
          <div className="mx-3 mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Demo data — changes reset on refresh
          </div>
        )}

        <nav className="flex-1 space-y-1 px-3 py-4">
          {visibleItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100'
                )
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-200 p-3">
          <div className="mb-2 flex items-center gap-2 px-2 py-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">
              {user?.fullName?.charAt(0) ?? '?'}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-gray-800">{user?.fullName}</div>
              <div className="truncate text-xs text-gray-500">{user ? ROLE_LABELS[user.role] : ''}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
