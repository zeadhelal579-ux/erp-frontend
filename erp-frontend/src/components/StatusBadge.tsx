import type { BatchState } from '@/lib/types/api';

// الألوان دي اتأكدت من الصور المعتمدة النهائية بعد كل جولات التعديل، مش من
// البرومبت الأول بس -- تحديدًا Quarantine (برتقالي، بعد إصلاح تعارضه مع Failed)
// و Rework_In_Progress (بنفسجي، بعد إصلاح لونه من رمادي).
const STATE_STYLES: Record<BatchState, { label: string; className: string; dot: string }> = {
  In_Production: { label: 'In Production', className: 'bg-blue-100 text-blue-700', dot: 'bg-blue-600' },
  Waiting_QC: { label: 'Waiting for Lab', className: 'bg-amber-100 text-amber-700', dot: 'bg-amber-600' },
  QC_Passed: { label: 'Lab Passed', className: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-600' },
  QC_Failed: { label: 'Lab Failed', className: 'bg-red-100 text-red-700', dot: 'bg-red-600' },
  Ready_For_Shipping: { label: 'Ready to Ship', className: 'bg-green-100 text-green-800', dot: 'bg-green-700' },
  Shipped: { label: 'Shipped', className: 'bg-gray-200 text-gray-700', dot: 'bg-gray-500' },
  Quarantine: { label: 'Quarantined', className: 'bg-orange-100 text-orange-800', dot: 'bg-orange-600' },
  Rework_In_Progress: {
    label: 'Rework in Progress',
    className: 'bg-purple-100 text-purple-700',
    dot: 'bg-purple-600',
  },
  Destroyed: { label: 'Destroyed', className: 'bg-gray-900 text-white', dot: 'bg-white' },
};

export function StatusBadge({ state }: { state: BatchState }) {
  const style = STATE_STYLES[state];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}
