import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPendingBatches, fetchPendingMaterials, submitLabResult } from './api';

export function usePendingMaterials() {
  return useQuery({ queryKey: ['lab', 'pending-materials'], queryFn: fetchPendingMaterials });
}

export function usePendingBatches() {
  return useQuery({ queryKey: ['lab', 'pending-batches'], queryFn: fetchPendingBatches });
}

export function useSubmitLabResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitLabResult,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab'] });
      // نتيجة معمل ناجحة على خامة بتحدّث IsQCApproved بتاعها، وعلى تشغيلة
      // بتحرّك CurrentState -- الشاشتين لازم يعرفوا يتحدّثوا.
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['batches'] });
    },
  });
}
