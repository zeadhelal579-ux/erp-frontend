import { useState } from 'react';
import { DataTable, type DataTableColumn } from '@/components/DataTable';
import { PageHeader } from '@/components/Spinner';
import type { BatchSummary } from '@/lib/types/api';
import { usePendingApprovals } from './hooks';
import { DecisionModal } from './components/DecisionModal';

export function ApprovalsPage() {
  const { data: batches, isLoading } = usePendingApprovals();
  const [decision, setDecision] = useState<{ batch: BatchSummary; approve: boolean } | null>(null);

  // ملحوظة: مفيش عمود "Lab Result" ولا "Lab Notes" هنا -- الإندبوينت الحقيقي
  // (/manager/pending-approvals) بيرجّع BatchSummaryDto بس (بدون أي بيانات
  // فحص معمل)، ومفلتر أصلًا على QC_Passed حصريًا. راجع التقرير المرفق لتفاصيل
  // هذه الفجوة والأثر المترتب عليها (تشغيلات QC_Failed محدش يقدر يشوفها هنا).
  const columns: DataTableColumn<BatchSummary>[] = [
    { header: 'Batch Number', cell: (b) => <span className="font-medium text-gray-900">{b.batchNumber}</span> },
    { header: 'Product', cell: (b) => `Product #${b.productId}` },
    { header: 'Produced Qty', cell: (b) => b.producedQty.toLocaleString() },
    { header: 'Created Date', cell: (b) => new Date(b.createdAt).toLocaleString('en-US') },
    {
      header: 'Actions',
      cell: (b) => (
        <div className="flex gap-2">
          <button
            onClick={() => setDecision({ batch: b, approve: true })}
            className="rounded-md border border-brand-200 px-3 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
          >
            Approve
          </button>
          <button
            onClick={() => setDecision({ batch: b, approve: false })}
            className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
          >
            Reject
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Approvals"
        description="Batches that passed lab testing, waiting on your decision. Review carefully before authorizing release."
      />

      <DataTable
        columns={columns}
        rows={batches ?? []}
        keyField={(b) => b.id}
        isLoading={isLoading}
        emptyMessage="No batches waiting on your decision right now."
      />

      {decision && (
        <DecisionModal batch={decision.batch} approve={decision.approve} onClose={() => setDecision(null)} />
      )}
    </div>
  );
}
