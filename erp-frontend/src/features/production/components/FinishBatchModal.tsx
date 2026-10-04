import { useMemo, useState, type FormEvent } from 'react';
import { FormField } from '@/components/FormField';
import { useFinishBatch } from '../hooks';
import type { ProductionBatch } from '@/lib/types/api';

export function FinishBatchModal({ batch, onClose }: { batch: ProductionBatch; onClose: () => void }) {
  const finishBatch = useFinishBatch();
  const [producedQty, setProducedQty] = useState('');
  const [returnedQty, setReturnedQty] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  // نفس "المعادلة الذهبية" الحقيقية من ProductionService.FinishBatchAsync:
  // Scrap = Issued - (Produced + Returned). معروضة هنا كمعاينة فقط -- الرقم
  // الملزم فعليًا بيتحسب تاني في الباك إند بنفس المعادلة بالظبط.
  const scrapPreview = useMemo(() => {
    const produced = Number(producedQty) || 0;
    const returned = Number(returnedQty) || 0;
    return batch.issuedMaterialQty - (produced + returned);
  }, [producedQty, returnedQty, batch.issuedMaterialQty]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await finishBatch.mutateAsync({
        batchId: batch.id,
        producedQty: Number(producedQty),
        returnedMaterialQty: Number(returnedQty),
        expiryDate,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to finish batch');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-base font-semibold text-gray-900">Finish Batch</h3>
        <p className="text-sm text-gray-500">
          {batch.batchNumber} — Issued: {batch.issuedMaterialQty}
        </p>

        <FormField
          label="Produced Quantity"
          type="number"
          min={0}
          step="0.01"
          value={producedQty}
          onChange={(e) => setProducedQty(e.target.value)}
          required
        />
        <FormField
          label="Returned Quantity"
          type="number"
          min={0}
          step="0.01"
          value={returnedQty}
          onChange={(e) => setReturnedQty(e.target.value)}
          required
        />

        <div className="rounded-md bg-gray-50 px-3 py-2">
          <p className={`text-sm font-medium ${scrapPreview < 0 ? 'text-red-600' : 'text-gray-700'}`}>
            Scrap / Waste: {scrapPreview.toLocaleString()} units
          </p>
          <p className="text-xs text-gray-400">
            Calculated automatically as Issued − (Produced + Returned), cannot be edited directly.
          </p>
          {scrapPreview < 0 && (
            <p className="text-xs text-red-500">
              Produced + Returned cannot exceed the issued quantity — the backend will reject this.
            </p>
          )}
        </div>

        <FormField
          label="Expiry Date"
          type="date"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
          required
          hint="Must be a future date."
        />

        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={finishBatch.isPending || scrapPreview < 0}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {finishBatch.isPending ? 'Submitting...' : 'Finish Batch'}
          </button>
        </div>
      </form>
    </div>
  );
}
