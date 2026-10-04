import { useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import { PageHeader } from '@/components/Spinner';
import { StatusBadge } from '@/components/StatusBadge';
import { useTraceabilitySearch } from './hooks';

// ==========================================================================
// ملحوظة صريحة: TraceabilityResponseDto الحقيقي شكله أسطح بكتير من التايم
// لاين المفصّل (بتاريخ + فاعل منفصلين لكل خطوة) اللي في تصميم Stitch المعتمد.
// اللي بيرجع فعليًا: CreatedAt/CreatedByUser منفصلين (بيانات حقيقية مُهيكلة)،
// وبعدهم مجرد نصوص جاهزة (LabResultsSummary كمصفوفة، ManagerDecisionSummary/
// ShippingSummary/ScrapSummary كل واحد نص مفرد أو null) -- من غير تاريخ أو
// اسم فاعل منفصل لكل واحد فيهم. عرضناها هنا كخطوات تايم لاين حقيقية بس بمحتوى
// نصي جاهز بدل تلفيق حقول تاريخ/فاعل غير موجودة. راجع التقرير المرفق.
// ==========================================================================

interface TimelineStep {
  label: string;
  detail?: string;
  meta?: string;
}

export function TraceabilityPage() {
  const [batchNumber, setBatchNumber] = useState('');
  const search = useTraceabilitySearch();

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (batchNumber.trim()) search.mutate(batchNumber.trim());
  }

  const trace = search.data;
  const steps: TimelineStep[] = trace
    ? [
        {
          label: 'Batch Created',
          meta: `${new Date(trace.createdAt).toLocaleString('en-US')}${
            trace.createdByUser ? ` — ${trace.createdByUser}` : ''
          }`,
        },
        {
          label: 'Materials Issued',
          detail: trace.rawMaterialName
            ? `${trace.rawMaterialName} (${trace.issuedMaterialQty} units)`
            : `${trace.issuedMaterialQty} units`,
        },
        ...trace.labResultsSummary.map((summary) => ({ label: 'Lab Result Submitted', detail: summary })),
        ...(trace.managerDecisionSummary
          ? [{ label: 'Manager Decision', detail: trace.managerDecisionSummary }]
          : []),
        ...(trace.scrapSummary ? [{ label: 'Quarantine / Scrap', detail: trace.scrapSummary }] : []),
        ...(trace.shippingSummary ? [{ label: 'Shipped', detail: trace.shippingSummary }] : []),
      ]
    : [];

  return (
    <div>
      <PageHeader title="Traceability" description="Look up any batch and see its complete history" />

      <form onSubmit={handleSearch} className="mb-6 flex max-w-lg gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            value={batchNumber}
            onChange={(e) => setBatchNumber(e.target.value)}
            placeholder="Enter a batch number, e.g. BATCH-20260902-4F8A2C"
            className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
          />
        </div>
        <button
          type="submit"
          disabled={search.isPending}
          className="rounded-md bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {search.isPending ? 'Searching...' : 'Search'}
        </button>
      </form>

      {search.isError && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {search.error instanceof Error ? search.error.message : 'Batch not found'}
        </p>
      )}

      {!trace && !search.isError && (
        <p className="text-center text-sm text-gray-400">Enter a batch number above to see its full journey.</p>
      )}

      {trace && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">Batch Details</p>
              <h2 className="text-lg font-semibold text-gray-900">{trace.batchNumber}</h2>
            </div>
            <StatusBadge state={trace.currentState} />
          </div>

          <ol className="space-y-6">
            {steps.map((step, i) => (
              <li key={i} className="relative flex gap-4 pl-1">
                <div className="flex flex-col items-center">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-brand-600 text-xs font-semibold text-brand-600">
                    {i + 1}
                  </span>
                  {i < steps.length - 1 && <span className="mt-1 w-px flex-1 bg-gray-200" />}
                </div>
                <div className="flex-1 rounded-lg bg-gray-50 px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">{step.label}</p>
                  {step.detail && <p className="mt-0.5 text-sm text-gray-600">{step.detail}</p>}
                  {step.meta && <p className="mt-0.5 text-xs text-gray-400">{step.meta}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
