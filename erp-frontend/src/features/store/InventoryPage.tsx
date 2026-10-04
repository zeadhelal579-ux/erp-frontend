import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { DataTable, type DataTableColumn } from '@/components/DataTable';
import { PageHeader } from '@/components/Spinner';
import { usePermissions } from '@/hooks/usePermissions';
import type { RawMaterial } from '@/lib/types/api';
import { useMaterials } from './hooks';
import { ReceiveMaterialModal } from './components/ReceiveMaterialModal';
import { IssueMaterialModal } from './components/IssueMaterialModal';
import { RecordWasteModal } from './components/RecordWasteModal';

export function InventoryPage() {
  const { hasRole } = usePermissions();
  // GeneralManager عنده صلاحية قراءة فقط هنا (مفيش [Authorize] له على أي
  // POST endpoint في StoreController) -- الأزرار بتتخفي، مش بس تتعطّل.
  const canManage = hasRole('Storekeeper');

  const [page, setPage] = useState(1);
  const { data, isLoading } = useMaterials(page);
  const [search, setSearch] = useState('');
  const [showReceive, setShowReceive] = useState(false);
  const [issueTarget, setIssueTarget] = useState<RawMaterial | null>(null);
  const [wasteTarget, setWasteTarget] = useState<RawMaterial | null>(null);

  const filteredItems = (data?.items ?? []).filter((m) =>
    m.materialName.toLowerCase().includes(search.toLowerCase())
  );

  const columns: DataTableColumn<RawMaterial>[] = [
    { header: 'Material Name', cell: (m) => <span className="font-medium text-gray-900">{m.materialName}</span> },
    { header: 'Supplier', cell: (m) => m.supplierName },
    { header: 'State', cell: (m) => m.physicalState },
    { header: 'Quantity', cell: (m) => m.currentQuantity.toLocaleString() },
    { header: 'Expiry Date', cell: (m) => new Date(m.expiryDate).toLocaleDateString('en-US') },
    {
      header: 'QC Status',
      cell: (m) =>
        m.isQCApproved ? (
          <span className="rounded-full border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700">
            Approved
          </span>
        ) : (
          <span className="rounded-full border border-amber-300 px-2.5 py-1 text-xs font-medium text-amber-700">
            Pending QC
          </span>
        ),
    },
  ];

  if (canManage) {
    columns.push({
      header: 'Actions',
      cell: (m) => (
        <div className="flex gap-2">
          {m.isQCApproved && m.currentQuantity > 0 && (
            <button
              onClick={() => setIssueTarget(m)}
              className="rounded-md border border-brand-200 px-3 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
            >
              Issue
            </button>
          )}
          <button
            onClick={() => setWasteTarget(m)}
            className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Record Waste
          </button>
        </div>
      ),
    });
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Track raw materials, monitor physical states, and manage controlled stock movements into the production cycle."
        action={
          canManage && (
            <button
              onClick={() => setShowReceive(true)}
              className="flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              <Plus size={16} />
              Receive Material
            </button>
          )
        }
      />

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">Material Inventory</h2>
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search materials..."
            className="w-full rounded-md border border-gray-300 py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={filteredItems}
        keyField={(m) => m.id}
        isLoading={isLoading}
        page={data?.page ?? page}
        totalPages={data?.totalPages}
        onPageChange={setPage}
        emptyMessage="No materials received yet"
      />

      {showReceive && <ReceiveMaterialModal onClose={() => setShowReceive(false)} />}
      {issueTarget && <IssueMaterialModal material={issueTarget} onClose={() => setIssueTarget(null)} />}
      {wasteTarget && <RecordWasteModal material={wasteTarget} onClose={() => setWasteTarget(null)} />}
    </div>
  );
}
