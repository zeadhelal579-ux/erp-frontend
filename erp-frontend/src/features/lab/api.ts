import { apiClient, unwrap } from '@/lib/api-client';
import type { ApiResponse, BatchSummary, PendingMaterial, SubmitLabResultRequest } from '@/lib/types/api';

// كل المسارات دي منسوخة حرفيًا من LabController.cs الفعلي.

export function fetchPendingMaterials() {
  return unwrap(apiClient.get<ApiResponse<PendingMaterial[]>>('/lab/pending-materials'));
}

export function fetchPendingBatches() {
  return unwrap(apiClient.get<ApiResponse<BatchSummary[]>>('/lab/pending-batches'));
}

export function submitLabResult(input: SubmitLabResultRequest) {
  return unwrap(apiClient.post<ApiResponse<unknown>>('/lab/submit-result', input));
}
