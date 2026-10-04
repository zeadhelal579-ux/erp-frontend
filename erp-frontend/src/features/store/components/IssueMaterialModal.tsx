import { useState, type FormEvent } from 'react';
import { FormField } from '@/components/FormField';
import { useIssueMaterial } from '../hooks';
import type { RawMaterial } from '@/lib/types/api';

export function IssueMaterialModal({
  material,
  onClose,
}: {
  material: RawMaterial;
  onClose: () => void;
}) {
  const issueMaterial = useIssueMaterial();
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const qty = Number(quantity);
    // فحص أولي لتجربة استخدام أفضل فقط -- القرار الملزم دائمًا في الباك إند
    // (INSUFFICIENT_QUANTITY هو الـ ErrorCode الحقيقي لو الرصيد مش كافي فعليًا).
    if (qty <= 0 || qty > material.currentQuantity) {
      setError('Quantity must be greater than zero and not exceed available stock');
      return;
    }
    try {
      await issueMaterial.mutateAsync({ rawMaterialId: material.id, quantityToIssue: qty });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to issue material');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-base font-semibold text-gray-900">Issue to Production</h3>
        <p className="text-sm text-gray-500">
          {material.materialName} — Available: {material.currentQuantity}
        </p>

        <FormField
          label="Quantity to Issue"
          type="number"
          min={0.01}
          max={material.currentQuantity}
          step="0.01"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
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
            disabled={issueMaterial.isPending}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {issueMaterial.isPending ? 'Issuing...' : 'Issue Stock'}
          </button>
        </div>
      </form>
    </div>
  );
}
