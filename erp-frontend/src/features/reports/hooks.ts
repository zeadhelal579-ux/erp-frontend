import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchDashboardStats, fetchTraceabilityByBatchNumber } from './api';

export function useDashboardStats() {
  return useQuery({ queryKey: ['reports', 'dashboard-stats'], queryFn: fetchDashboardStats });
}

export function useTraceabilitySearch() {
  return useMutation({ mutationFn: fetchTraceabilityByBatchNumber });
}
