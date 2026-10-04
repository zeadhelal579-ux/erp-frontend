import { useState, type FormEvent } from 'react';
import { FormField, FormSelect } from '@/components/FormField';
import { useApprovedMaterials } from '@/features/store/hooks';
import { useStartBatch } from '../hooks';

export function StartBatchModal({ onClose }: { onClose: () => void }) {
  const { data: approvedMaterials, isLoading: loadingMaterials } = useApprovedMaterials();
  const startBatch = useStartBatch();

  const [productId, setProductId] = useState('');
  const [rawMaterialId, setRawMaterialId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState<string | null>(null);

  const selectedMaterial = approvedMaterials?.find((m) => m.id === Number(rawMaterialId));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const qty = Number(quantity);
    // فحص أولي بسيط زي بقية المودالز -- StartBatchValidator بيرفض أي قيمة <= 0
    // فعليًا (GreaterThan(0))، أفضل نمسك ده هنا بدل ما نستنى رحلة الشبكة كاملة.
    if (qty <= 0) {
      setError('Quantity to issue must be greater than zero');
      return;
    }
    try {
      await startBatch.mutateAsync({
        productId: Number(productId),
        rawMaterialId: Number(rawMaterialId),
        issuedMaterialQty: qty,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start batch');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-base font-semibold text-gray-900">Start New Batch</h3>

        {/*
          ملحوظة صريحة: مفيش أي Endpoint في الباك إند بيرجّع قائمة المنتجات
          (لا يوجد ProductsController خالص) -- فمفيش طريقة حقيقية نملي بيها
          Dropdown بأسماء منتجات فعلية. الاختيار هنا إدخال رقمي صريح بدل
          اختراع قائمة منتجات وهمية، وده موثّق كفجوة مطلوب سدّها في التقرير المرفق.
        */}
        <FormField
          label="Product ID"
          type="number"
          min={1}
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          required
          hint="No products listing endpoint exists yet in the backend — enter the numeric Product ID directly until one is added."
        />

        <FormSelect
          label="Raw Material"
          value={rawMaterialId}
          onChange={setRawMaterialId}
          options={[
            { value: '', label: loadingMaterials ? 'Loading...' : 'Select an approved material' },
            ...(approvedMaterials ?? []).map((m) => ({
              value: String(m.id),
              label: `${m.materialName} — ${m.currentQuantity} available`,
            })),
          ]}
        />

        <FormField
          label="Quantity to Issue"
          type="number"
          min={0.01}
          max={selectedMaterial?.currentQuantity}
          step="0.01"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
          hint="The backend does not currently re-verify this against live stock at start-batch time — it only confirms the material is QC-approved."
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
            disabled={startBatch.isPending}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {startBatch.isPending ? 'Starting...' : 'Start Batch'}
          </button>
        </div>
      </form>
    </div>
  );
}
