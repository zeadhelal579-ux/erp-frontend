import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPendingApprovals, makeDecision } from './api';

export function usePendingApprovals() {
  return useQuery({ queryKey: ['approvals', 'pending'], queryFn: fetchPendingApprovals });
}

export function useMakeDecision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: makeDecision,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      // رفض بينشئ سطر عزل جديد فورًا (SourceType: ManagerRejection) --
      // شاشة العزل والهالك لازم تشوفه فورًا لو مفتوحة.
      queryClient.invalidateQueries({ queryKey: ['quarantine'] });
    },
  });
}
