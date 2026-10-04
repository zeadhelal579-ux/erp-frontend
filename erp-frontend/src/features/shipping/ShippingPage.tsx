import { useState } from 'react';
import { DataTable, type DataTableColumn } from '@/components/DataTable';
import { PageHeader } from '@/components/Spinner';
import { usePermissions } from '@/hooks/usePermissions';
import type { BatchSummary, ShipmentRecord } from '@/lib/types/api';
import { useReadyToShip, useShipmentHistory } from './hooks';
import { CreateShipmentModal } from './components/CreateShipmentModal';

export function ShippingPage() {
  const { hasRole } = usePermissions();
  const canManage = hasRole('Storekeeper');

  const { data: readyBatches, isLoading: loadingReady } = useReadyToShip();
  const [historyPage, setHistoryPage] = useState(1);
  const { data: history, isLoading: loadingHistory } = useShipmentHistory(historyPage);
  const [shipTarget, setShipTarget] = useState<BatchSummary | null>(null);

  const readyColumns: DataTableColumn<BatchSummary>[] = [
    { header: 'Batch Number', cell: (b) => <span className="font-medium text-gray-900">{b.batchNumber}</span> },
    { header: 'Product', cell: (b) => `Product #${b.productId}` },
    { header: 'Produced Qty', cell: (b) => b.producedQty.toLocaleString() },
  ];

  if (canManage) {
    readyColumns.push({
      header: 'Action',
      cell: (b) => (
        <button
          onClick={() => setShipTarget(b)}
          className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
        >
          Create Shipment
        </button>
      ),
    });
  }

  const historyColumns: DataTableColumn<ShipmentRecord>[] = [
    { header: 'Batch Number', cell: (s) => s.batchNumber },
    { header: 'Client', cell: (s) => s.clientName },
    { header: 'Driver', cell: (s) => s.driverName },
    { header: 'Truck Plate', cell: (s) => s.truckPlates },
    { header: 'Date', cell: (s) => new Date(s.shippingDate).toLocaleDateString('en-US') },
  ];

  return (
    <div>
      <PageHeader title="Shipping" description="Log outbound shipments for batches that are ready." />

      <h2 className="mb-3 text-sm font-semibold text-gray-700">Ready to Ship</h2>
      <div className="mb-8">
        <DataTable
          columns={readyColumns}
          rows={readyBatches ?? []}
          keyField={(b) => b.id}
          isLoading={loadingReady}
          emptyMessage="No batches ready to ship right now"
        />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-gray-700">Shipment History</h2>
      <DataTable
        columns={historyColumns}
        rows={history?.items ?? []}
        keyField={(s) => s.id}
        isLoading={loadingHistory}
        page={history?.page ?? historyPage}
        totalPages={history?.totalPages}
        onPageChange={setHistoryPage}
        emptyMessage="No shipments logged yet"
      />

      {shipTarget && <CreateShipmentModal batch={shipTarget} onClose={() => setShipTarget(null)} />}
    </div>
  );
}
