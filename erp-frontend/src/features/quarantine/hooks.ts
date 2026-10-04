import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { approveRework, fetchPendingScrapEntries, qualityDecision } from './api';

export function usePendingScrapEntries() {
  return useQuery({ queryKey: ['quarantine', 'pending'], queryFn: fetchPendingScrapEntries });
}

export function useQualityDecision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: qualityDecision,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quarantine'] });
      queryClient.invalidateQueries({ queryKey: ['batches'] }); // Destroy بيحدّث CurrentState للتشغيلة كمان
    },
  });
}

export function useApproveRework() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approveRework,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quarantine'] });
      queryClient.invalidateQueries({ queryKey: ['batches'] });
    },
  });
}
