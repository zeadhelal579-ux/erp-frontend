import { useState, type FormEvent } from 'react';
import { FormTextarea } from '@/components/FormField';
import { useSubmitLabResult } from '../hooks';
import type { InspectionType } from '@/lib/types/api';

interface SubmitResultModalProps {
  inspectionType: InspectionType;
  itemLabel: string;
  batchId?: number;
  rawMaterialId?: number;
  onClose: () => void;
}

// عمدًا مفيش أي كلمة "Approve" أو "Reject" في الشاشة دي -- فني المعمل بيسجّل
// نتيجة فنية بس (Passed/Failed)، القرار النهائي مش من اختصاصه إطلاقًا.
export function SubmitResultModal({
  inspectionType,
  itemLabel,
  batchId,
  rawMaterialId,
  onClose,
}: SubmitResultModalProps) {
  const submitResult = useSubmitLabResult();
  const [result, setResult] = useState<'Passed' | 'Failed'>('Passed');
  const [resultDetails, setResultDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await submitResult.mutateAsync({
        inspectionType,
        batchId: batchId ?? null,
        rawMaterialId: rawMaterialId ?? null,
        resultDetails,
        isPassed: result === 'Passed',
        notes: notes || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit result');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-base font-semibold text-gray-900">Submit Lab Result</h3>
        <p className="text-sm text-gray-500">{itemLabel}</p>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Result</label>
          <div className="flex gap-2">
            {(['Passed', 'Failed'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setResult(option)}
                className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${
                  result === option
                    ? option === 'Passed'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <FormTextarea
          label="Result Details"
          value={resultDetails}
          onChange={setResultDetails}
          required
          rows={3}
        />
        <FormTextarea label="Notes (optional)" value={notes} onChange={setNotes} rows={2} />

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
            disabled={submitResult.isPending}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {submitResult.isPending ? 'Submitting...' : 'Submit Result'}
          </button>
        </div>
      </form>
    </div>
  );
}
