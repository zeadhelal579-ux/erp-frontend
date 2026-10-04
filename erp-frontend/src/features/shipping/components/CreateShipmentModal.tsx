import { useState, type FormEvent } from 'react';
import { FormField } from '@/components/FormField';
import { useCreateShipment } from '../hooks';
import type { BatchSummary } from '@/lib/types/api';

export function CreateShipmentModal({ batch, onClose }: { batch: BatchSummary; onClose: () => void }) {
  const createShipment = useCreateShipment();
  const [clientName, setClientName] = useState('');
  const [driverName, setDriverName] = useState('');
  const [truckPlates, setTruckPlates] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createShipment.mutateAsync({ batchId: batch.id, clientName, driverName, truckPlates });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create shipment');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-base font-semibold text-gray-900">Create Shipment</h3>
        <p className="text-sm text-gray-500">{batch.batchNumber}</p>

        <FormField
          label="Client Name"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          required
          hint="Free text — there is no saved customer list in this system."
        />
        <FormField label="Driver Name" value={driverName} onChange={(e) => setDriverName(e.target.value)} required />
        <FormField
          label="Truck Plate Number"
          value={truckPlates}
          onChange={(e) => setTruckPlates(e.target.value)}
          required
        />
        {/*
          عمدًا مفيش حقل تاريخ هنا -- CreateShipmentDto الحقيقي مفهوش ShippingDate
          خالص، الباك إند بيسجّله DateTime.UtcNow لحظة الإنشاء تلقائيًا.
        */}

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
            disabled={createShipment.isPending}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {createShipment.isPending ? 'Saving...' : 'Confirm Shipment'}
          </button>
        </div>
      </form>
    </div>
  );
}
