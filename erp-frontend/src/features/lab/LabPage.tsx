import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/Spinner';
import { usePermissions } from '@/hooks/usePermissions';
import { usePendingBatches, usePendingMaterials } from './hooks';
import { SubmitResultModal } from './components/SubmitResultModal';
import type { InspectionType } from '@/lib/types/api';

interface PendingTarget {
  inspectionType: InspectionType;
  itemLabel: string;
  batchId?: number;
  rawMaterialId?: number;
}

export function LabPage() {
  const { hasRole } = usePermissions();
  const canSubmit = hasRole('LabTech');

  const { data: materials, isLoading: loadingMaterials } = usePendingMaterials();
  const { data: batches, isLoading: loadingBatches } = usePendingBatches();
  const [target, setTarget] = useState<PendingTarget | null>(null);

  return (
    <div>
      <PageHeader title="Lab / QC" description="Record test results — pass or fail." />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-800">Materials Awaiting Testing</h2>
            <span className="rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-medium text-white">
              {materials?.length ?? 0} pending
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {loadingMaterials ? (
              <p className="px-4 py-6 text-center text-sm text-gray-400">Loading...</p>
            ) : materials && materials.length > 0 ? (
              materials.map((m) => (
                <div key={m.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{m.materialName}</p>
                    <p className="text-xs text-gray-400">{m.supplierName}</p>
                  </div>
                  {canSubmit && (
                    <button
                      onClick={() =>
                        setTarget({
                          inspectionType: 'IncomingMaterial',
                          itemLabel: m.materialName,
                          rawMaterialId: m.id,
                        })
                      }
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Submit Result
                    </button>
                  )}
                </div>
              ))
            ) : (
              <EmptyPanel />
            )}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-800">Batches Awaiting Testing</h2>
            <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-600">
              {batches?.length ?? 0} pending
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {loadingBatches ? (
              <p className="px-4 py-6 text-center text-sm text-gray-400">Loading...</p>
            ) : batches && batches.length > 0 ? (
              batches.map((b) => (
                <div key={b.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{b.batchNumber}</p>
                    <p className="text-xs text-gray-400">Product #{b.productId}</p>
                  </div>
                  {canSubmit && (
                    <button
                      onClick={() =>
                        setTarget({ inspectionType: 'FinishedBatch', itemLabel: b.batchNumber, batchId: b.id })
                      }
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Submit Result
                    </button>
                  )}
                </div>
              ))
            ) : (
              <EmptyPanel />
            )}
          </div>
        </div>
      </div>

      {target && (
        <SubmitResultModal
          inspectionType={target.inspectionType}
          itemLabel={target.itemLabel}
          batchId={target.batchId}
          rawMaterialId={target.rawMaterialId}
          onClose={() => setTarget(null)}
        />
      )}
    </div>
  );
}

function EmptyPanel() {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <CheckCircle2 className="text-gray-300" size={28} />
      <p className="text-sm text-gray-500">Nothing waiting right now.</p>
      <p className="text-xs text-gray-400">All items have been tested.</p>
    </div>
  );
}
