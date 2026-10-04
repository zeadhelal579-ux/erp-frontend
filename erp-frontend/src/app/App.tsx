import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/lib/types/api';
import { AppLayout } from '@/components/Layout';
import { RequireAuth } from './RequireAuth';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { InventoryPage } from '@/features/store/InventoryPage';
import { ProductionPage } from '@/features/production/ProductionPage';
import { LabPage } from '@/features/lab/LabPage';
import { ApprovalsPage } from '@/features/approvals/ApprovalsPage';
import { QuarantinePage } from '@/features/quarantine/QuarantinePage';
import { ShippingPage } from '@/features/shipping/ShippingPage';
import { OverviewPage } from '@/features/reports/OverviewPage';
import { TraceabilityPage } from '@/features/reports/TraceabilityPage';

// ==========================================================================
// خريطة الأدوار والمسارات دي متأكدة حرفيًا من [Authorize(Roles = "...")] الفعلية
// على كل Controller في ERP-Backend-Migrated.zip -- مش من جدول 5.5 في المستند
// المعماري الأصلي، اللي طلع أضيق من الصلاحيات الحقيقية في حالة GeneralManager
// تحديدًا (راجع قسم "فجوات مكتشفة" في التقرير المرفق للتفاصيل الكاملة):
//
//  StoreController      reads: Storekeeper, SuperAdmin, GeneralManager
//  ProductionController reads: ProductionManager, SuperAdmin, GeneralManager
//  LabController        reads: LabTech, SuperAdmin, GeneralManager
//  ManagerController          : QualityManager, SuperAdmin فقط (مفيش GeneralManager خالص)
//  ScrapController   pending/all: QualityManager, GeneralManager, SuperAdmin
//  ShippingController    reads: Storekeeper, SuperAdmin, GeneralManager
//  ReportsController          : GeneralManager, SuperAdmin فقط
// ==========================================================================

const ROLE_HOME: Record<UserRole, string> = {
  Storekeeper: '/inventory',
  ProductionManager: '/production',
  LabTech: '/lab',
  QualityManager: '/approvals',
  GeneralManager: '/overview',
  SuperAdmin: '/inventory',
};

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? ROLE_HOME[user.role] : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomeRedirect />} />

          <Route element={<ProtectedRoute allowedRoles={['Storekeeper', 'GeneralManager']} />}>
            <Route path="/inventory" element={<InventoryPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['ProductionManager', 'GeneralManager']} />}>
            <Route path="/production" element={<ProductionPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['LabTech', 'GeneralManager']} />}>
            <Route path="/lab" element={<LabPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['QualityManager']} />}>
            <Route path="/approvals" element={<ApprovalsPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['QualityManager', 'GeneralManager']} />}>
            <Route path="/quarantine" element={<QuarantinePage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['Storekeeper', 'GeneralManager']} />}>
            <Route path="/shipping" element={<ShippingPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['GeneralManager']} />}>
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/traceability" element={<TraceabilityPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
