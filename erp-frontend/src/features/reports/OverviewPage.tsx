import { AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/Spinner';
import { useDashboardStats } from './hooks';

function StatCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`rounded-lg border-l-4 border border-gray-200 bg-white p-4 ${tone}`}>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value.toLocaleString()}</p>
    </div>
  );
}

export function OverviewPage() {
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <div>
      <PageHeader title="Overview" description="A snapshot of the whole operation." />

      {isLoading || !stats ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-3">
            <StatCard label="In Production" value={stats.inProductionCount} tone="border-l-blue-600" />
            <StatCard label="Waiting for Lab" value={stats.waitingQcCount} tone="border-l-amber-500" />
            <StatCard label="Passed, Awaiting Decision" value={stats.pendingApprovalCount} tone="border-l-emerald-600" />
            <StatCard label="In Quarantine" value={stats.quarantineCount} tone="border-l-orange-500" />
            <StatCard label="Shipped" value={stats.shippedCount} tone="border-l-gray-400" />
            <StatCard label="Total Batches" value={stats.totalBatches} tone="border-l-gray-300" />
          </div>

          <div className="mb-6 grid grid-cols-3 gap-4">
            <StatCard label="Total Scrap Qty" value={stats.totalScrapQty} tone="border-l-red-400" />
            <StatCard label="Total Destroyed Qty" value={stats.totalDestroyedQty} tone="border-l-gray-800" />
            <StatCard label="Reworked Batches" value={stats.totalReworkedBatches} tone="border-l-purple-500" />
          </div>

          {/*
            ==================================================================
            ملحوظة صريحة، مش سهو: مفيش هنا رسم "Production Output Over Time"
            ولا رسم "Scrap & Waste by Source" زي تصميم Stitch المعتمد.
            GetDashboardStatsAsync الحقيقي بيرجّع أرقام إجمالية بس (زي فوق) --
            مفيش أي بيانات زمنية (لرسم خطي)، ومفيش تقسيم الهالك حسب المصدر
            (Raw Material / Production Line / Manager Rejection) رغم إن الأنواع
            التلاتة دي موجودة فعليًا في قاعدة البيانات -- الإندبوينت مبيجمّعهاش
            حسب المصدر حاليًا. رسم رسمين ببيانات ملفّقة كان هيكرر بالظبط نفس
            الغلطة اللي صلّحناها في مراجعة تصاميم Stitch. التفاصيل والحل المقترح
            في التقرير المرفق.
            ==================================================================
          */}
          <div className="flex items-start gap-3 rounded-lg border border-dashed border-gray-300 bg-white p-5">
            <AlertTriangle className="mt-0.5 shrink-0 text-amber-500" size={18} />
            <div>
              <p className="text-sm font-medium text-gray-700">
                Two charts from the approved design are intentionally not shown here
              </p>
              <p className="mt-1 text-sm text-gray-500">
                "Production Output Over Time" and "Scrap &amp; Waste by Source" would require data this
                endpoint does not currently provide (a time series, and a scrap breakdown by source). Showing
                them would mean inventing numbers. See the accompanying report for the two small backend
                additions that would unlock them honestly.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
