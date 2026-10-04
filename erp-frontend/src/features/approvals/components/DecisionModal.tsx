import { useState } from 'react';
import { FormTextarea } from '@/components/FormField';
import { useMakeDecision } from '../hooks';
import type { BatchSummary } from '@/lib/types/api';

export function DecisionModal({
  batch,
  approve,
  onClose,
}: {
  batch: BatchSummary;
  approve: boolean;
  onClose: () => void;
}) {
  const makeDecision = useMakeDecision();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setError(null);
    // ManagerDecisionValidator: Reason إجباري فعليًا لو approve=false بس.
    if (!approve && reason.trim() === '') {
      setError('A reason is required when rejecting a batch');
      return;
    }
    try {
      await makeDecision.mutateAsync({ batchId: batch.id, approve, reason: reason || null });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record decision');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-base font-semibold text-gray-900">
          {approve ? 'Approve for shipping?' : 'Reject this batch?'}
        </h3>
        <p className="text-sm text-gray-600">
          {approve
            ? `${batch.batchNumber} will move to Ready for Shipping.`
            : `${batch.batchNumber} will move to Quarantine for a destroy-or-rework decision.`}
        </p>

        {!approve && (
          <FormTextarea label="Reason" value={reason} onChange={setReason} required rows={3} />
        )}

        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={makeDecision.isPending}
            className={`rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60 ${
              approve ? 'bg-brand-600 hover:bg-brand-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {makeDecision.isPending ? 'Submitting...' : approve ? 'Confirm Approve' : 'Confirm Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}
