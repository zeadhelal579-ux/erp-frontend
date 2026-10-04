import { useState, type ReactNode } from 'react';
import { PageHeader } from '@/components/Spinner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { usePermissions } from '@/hooks/usePermissions';
import type { ScrapEntry } from '@/lib/types/api';
import { useApproveRework, usePendingScrapEntries, useQualityDecision } from './hooks';
import { groupScrapEntries } from './groupScrapEntries';

export function QuarantinePage() {
  const { hasRole } = usePermissions();
  const isQualityManager = hasRole('QualityManager');
  const isGeneralManager = hasRole('GeneralManager');

  const { data: entries, isLoading } = usePendingScrapEntries();
  const qualityDecision = useQualityDecision();
  const approveRework = useApproveRework();

  const [destroyTarget, setDestroyTarget] = useState<ScrapEntry | null>(null);

  const { awaitingDecision, awaitingReworkApproval } = groupScrapEntries(entries ?? []);

  async function handleRequestRework(entry: ScrapEntry) {
    try {
      await qualityDecision.mutateAsync({ scrapEntryId: entry.id, decision: 'RequestRework' });
    } catch {
      // الخطأ بيتلقط ويتعرض عادة عبر مكتبة إشعارات مركزية في تطبيق حقيقي --
      // هنا الأبسط الاعتماد على إعادة المحاولة اليدوية من المستخدم.
    }
  }

  async function handleDestroy() {
    if (!destroyTarget) return;
    try {
      await qualityDecision.mutateAsync({ scrapEntryId: destroyTarget.id, decision: 'Destroy' });
      setDestroyTarget(null);
    } catch {
      // نفس الملحوظة أعلاه
    }
  }

  return (
    <div>
      <PageHeader
        title="Quarantine & Scrap"
        description="Manage non-conforming materials, rework requests, and scrap approvals."
      />

      <div className="mb-6 rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-800">Awaiting Your Decision</h2>
          {isQualityManager && <p className="text-xs text-gray-400">Quality Manager</p>}
        </div>
        <QuarantineTable
          entries={awaitingDecision}
          isLoading={isLoading}
          renderActions={
            isQualityManager
              ? (entry) => (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDestroyTarget(entry)}
                      className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                    >
                      Destroy
                    </button>
                    <button
                      onClick={() => handleRequestRework(entry)}
                      disabled={qualityDecision.isPending}
                      className="rounded-md border border-purple-300 px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-50 disabled:opacity-60"
                    >
                      Request Rework
                    </button>
                  </div>
                )
              : undefined
          }
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-800">Awaiting Rework Approval</h2>
          {isGeneralManager && <p className="text-xs text-gray-400">General Manager approval required</p>}
        </div>
        <QuarantineTable
          entries={awaitingReworkApproval}
          isLoading={isLoading}
          statusLabel="Sent to Rework"
          renderActions={
            isGeneralManager
              ? (entry) => (
                  <button
                    onClick={() => approveRework.mutate(entry.id)}
                    disabled={approveRework.isPending}
                    className="rounded-md border border-purple-300 px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-50 disabled:opacity-60"
                  >
                    Approve Rework
                  </button>
                )
              : undefined
          }
        />
      </div>

      <ConfirmDialog
        open={destroyTarget !== null}
        title="Destroy permanently?"
        description="This action is final and cannot be undone."
        confirmLabel="Confirm Destroy"
        destructive
        isSubmitting={qualityDecision.isPending}
        onConfirm={handleDestroy}
        onCancel={() => setDestroyTarget(null)}
      />
    </div>
  );
}

function QuarantineTable({
  entries,
  isLoading,
  statusLabel,
  renderActions,
}: {
  entries: ScrapEntry[];
  isLoading: boolean;
  statusLabel?: string;
  renderActions?: (entry: ScrapEntry) => ReactNode;
}) {
  if (isLoading) {
    return <p className="px-4 py-8 text-center text-sm text-gray-400">Loading...</p>;
  }
  if (entries.length === 0) {
    return <p className="px-4 py-8 text-center text-sm text-gray-400">Nothing here right now.</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
        <tr>
          <th className="px-4 py-3 text-left font-medium">Batch / Ref</th>
          <th className="px-4 py-3 text-left font-medium">Qty</th>
          <th className="px-4 py-3 text-left font-medium">Reason for Quarantine</th>
          <th className="px-4 py-3 text-left font-medium">Date Flagged</th>
          {statusLabel && <th className="px-4 py-3 text-left font-medium">Status</th>}
          {renderActions && <th className="px-4 py-3 text-left font-medium">Actions</th>}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {entries.map((entry) => (
          <tr key={entry.id}>
            <td className="px-4 py-3 font-medium text-gray-900">
              {entry.sourceType} #{entry.referenceId}
            </td>
            <td className="px-4 py-3">{entry.quantity.toLocaleString()} units</td>
            <td className="px-4 py-3 text-gray-600">{entry.scrapReason}</td>
            <td className="px-4 py-3 text-gray-500">{new Date(entry.createdAt).toLocaleDateString('en-US')}</td>
            {statusLabel && (
              <td className="px-4 py-3">
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">{statusLabel}</span>
              </td>
            )}
            {renderActions && <td className="px-4 py-3">{renderActions(entry)}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
