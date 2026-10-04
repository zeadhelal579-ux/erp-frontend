import { useState, type FormEvent } from 'react';
import { FormField, FormSelect } from '@/components/FormField';
import { useAddMaterial } from '../hooks';
import type { PhysicalState } from '@/lib/types/api';

// القيم الأربعة دي مؤكدة حرفيًا من AddRawMaterialValidator.ValidStates في الباك إند.
const PHYSICAL_STATES: PhysicalState[] = ['Liquid', 'Solid', 'Frozen', 'Powder'];

export function ReceiveMaterialModal({ onClose }: { onClose: () => void }) {
  const addMaterial = useAddMaterial();
  const [form, setForm] = useState({
    materialName: '',
    supplierName: '',
    quantity: '',
    physicalState: PHYSICAL_STATES[0] as string,
    expiryDate: '',
  });
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await addMaterial.mutateAsync({
        materialName: form.materialName,
        supplierName: form.supplierName,
        quantity: Number(form.quantity),
        physicalState: form.physicalState as PhysicalState,
        expiryDate: form.expiryDate,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save material');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-base font-semibold text-gray-900">Receive Material</h3>

        <FormField
          label="Material Name"
          value={form.materialName}
          onChange={(e) => setForm({ ...form, materialName: e.target.value })}
          required
        />
        <FormField
          label="Supplier"
          value={form.supplierName}
          onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
          required
        />
        <FormField
          label="Quantity"
          type="number"
          min={0.01}
          step="0.01"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          required
        />
        <FormSelect
          label="Physical State"
          value={form.physicalState}
          onChange={(v) => setForm({ ...form, physicalState: v })}
          options={PHYSICAL_STATES.map((s) => ({ value: s, label: s }))}
        />
        <FormField
          label="Expiry Date"
          type="date"
          value={form.expiryDate}
          onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
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
            disabled={addMaterial.isPending}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {addMaterial.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
