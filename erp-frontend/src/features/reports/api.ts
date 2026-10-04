import { apiClient, unwrap } from '@/lib/api-client';
import type { ApiResponse, DashboardStats, Traceability } from '@/lib/types/api';

// كل المسارات دي منسوخة حرفيًا من ReportsController.cs الفعلي.

export function fetchDashboardStats() {
  return unwrap(apiClient.get<ApiResponse<DashboardStats>>('/reports/dashboard-stats'));
}

export function fetchTraceabilityByBatchNumber(batchNumber: string) {
  return unwrap(
    apiClient.get<ApiResponse<Traceability>>(`/reports/traceability/by-number/${encodeURIComponent(batchNumber)}`)
  );
}
