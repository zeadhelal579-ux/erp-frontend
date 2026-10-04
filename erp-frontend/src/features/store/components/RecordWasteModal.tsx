import { useState, type FormEvent } from 'react';
import { FormField, FormTextarea } from '@/components/FormField';
import { useRecordMaterialWaste } from '../hooks';
import type { RawMaterial } from '@/lib/types/api';

export function RecordWasteModal({
  material,
  onClose,
}: {
  material: RawMaterial;
  onClose: () => void;
}) {
  const recordWaste = useRecordMaterialWaste();
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const qty = Number(quantity);
    // نفس الفحص الأولي الموجود في IssueMaterialModal -- كان ناقص هنا رغم إن الحقل
    // بيمثّل نفس القيد بالظبط (كمية لا تتجاوز الرصيد المتاح). القرار الملزم يفضل
    // دايمًا في الباك إند (INSUFFICIENT_QUANTITY هو الـ ErrorCode الحقيقي).
    if (qty <= 0 || qty > material.currentQuantity) {
      setError('Quantity must be greater than zero and not exceed available stock');
      return;
    }
    try {
      await recordWaste.mutateAsync({
        rawMaterialId: material.id,
        wastedQuantity: qty,
        reason,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record waste');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-base font-semibold text-gray-900">Record Waste</h3>
        <p className="text-sm text-gray-500">
          {material.materialName} — Available: {material.currentQuantity}
        </p>

        <FormField
          label="Wasted Quantity"
          type="number"
          min={0.01}
          max={material.currentQuantity}
          step="0.01"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />
        <FormTextarea label="Reason" value={reason} onChange={setReason} required rows={2} />

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
            disabled={recordWaste.isPending}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {recordWaste.isPending ? 'Saving...' : 'Record Waste'}
          </button>
        </div>
      </form>
    </div>
  );
}
