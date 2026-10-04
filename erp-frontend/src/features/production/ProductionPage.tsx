import { useState } from 'react';
import { Plus } from 'lucide-react';
import { DataTable, type DataTableColumn } from '@/components/DataTable';
import { PageHeader } from '@/components/Spinner';
import { StatusBadge } from '@/components/StatusBadge';
import { usePermissions } from '@/hooks/usePermissions';
import type { ProductionBatch } from '@/lib/types/api';
import { useBatches } from './hooks';
import { StartBatchModal } from './components/StartBatchModal';
import { FinishBatchModal } from './components/FinishBatchModal';

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

export function ProductionPage() {
  const { hasRole } = usePermissions();
  const canManage = hasRole('ProductionManager');

  const [page, setPage] = useState(1);
  const { data, isLoading } = useBatches(page);

  // ==========================================================================
  // ملحوظة صريحة: مفيش Endpoint متاح لهذا الدور بيرجّع إحصائيات عامة (
  // /reports/dashboard-stats مقصور على GeneralManager/SuperAdmin فقط). الأرقام
  // دي محسوبة من أول 100 تشغيلة بترتيب الأحدث أولًا -- تقريب معقول لحجم مصنع
  // واحد، مش عدّاد دقيق 100% على مستوى قاعدة البيانات كلها. الحل الأمثل طويل
  // المدى: Endpoint إحصائيات مخصص لهذا الدور، موثّق في التقرير المرفق.
  // ==========================================================================
  const { data: statsSample } = useBatches(1, 100);
  const activeBatches = statsSample?.items.filter((b) => b.currentState === 'In_Production').length ?? 0;
  const waitingForLab = statsSample?.items.filter((b) => b.currentState === 'Waiting_QC').length ?? 0;
  const reworkQueue = statsSample?.items.filter((b) => b.currentState === 'Rework_In_Progress').length ?? 0;

  const [showStart, setShowStart] = useState(false);
  const [finishTarget, setFinishTarget] = useState<ProductionBatch | null>(null);

  const columns: DataTableColumn<ProductionBatch>[] = [
    { header: 'Batch Number', cell: (b) => <span className="font-medium text-gray-900">{b.batchNumber}</span> },
    {
      // مفيش productName ولا rawMaterialName في BatchResponseDto الحقيقي --
      // عارضين الـ IDs بوضوح بدل اختراع أسماء (راجع التقرير المرفق).
      header: 'Product & Raw Material',
      cell: (b) => (
        <div>
          <div>Product #{b.productId}</div>
          <div className="text-xs text-gray-400">Material #{b.rawMaterialId}</div>
        </div>
      ),
    },
    { header: 'Issued Qty', cell: (b) => b.issuedMaterialQty.toLocaleString() },
    {
      header: 'Status',
      cell: (b) => (
        <div className="flex flex-col gap-1">
          <StatusBadge state={b.currentState} />
          {b.isReworked && (
            <span className="w-fit rounded-full bg-purple-50 px-2 py-0.5 text-[11px] text-purple-600">
              Reworked
            </span>
          )}
        </div>
      ),
    },
    { header: 'Created Date', cell: (b) => new Date(b.createdAt).toLocaleString('en-US') },
  ];

  if (canManage) {
    columns.push({
      header: 'Actions',
      cell: (b) =>
        b.currentState === 'In_Production' || b.currentState === 'Rework_In_Progress' ? (
          <button
            onClick={() => setFinishTarget(b)}
            className="rounded-md border border-brand-200 px-3 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
          >
            Finish Batch
          </button>
        ) : null,
    });
  }

  return (
    <div>
      <PageHeader
        title="Production Management"
        description="Start new batches, monitor real-time processing status, and log completed production cycles across all active lines."
        action={
          canManage && (
            <button
              onClick={() => setShowStart(true)}
              className="flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              <Plus size={16} />
              Start New Batch
            </button>
          )
        }
      />

      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard label="Active Batches" value={activeBatches} />
        <StatCard label="Waiting for Lab" value={waitingForLab} />
        <StatCard label="Rework Queue" value={reworkQueue} />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-gray-700">Current Production Batches</h2>
      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        keyField={(b) => b.id}
        isLoading={isLoading}
        page={data?.page ?? page}
        totalPages={data?.totalPages}
        onPageChange={setPage}
        emptyMessage="No batches in production yet"
      />

      {showStart && <StartBatchModal onClose={() => setShowStart(false)} />}
      {finishTarget && <FinishBatchModal batch={finishTarget} onClose={() => setFinishTarget(null)} />}
    </div>
  );
}
