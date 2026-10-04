import { apiClient, unwrap } from '@/lib/api-client';
import type {
  ApiResponse,
  FinishBatchRequest,
  PagedResult,
  ProductionBatch,
  StartBatchRequest,
} from '@/lib/types/api';

// كل المسارات دي منسوخة حرفيًا من ProductionController.cs الفعلي.

export function fetchBatches(page: number, pageSize = 10) {
  return unwrap(
    apiClient.get<ApiResponse<PagedResult<ProductionBatch>>>('/production/batches', {
      params: { page, pageSize },
    })
  );
}

export function startBatch(input: StartBatchRequest) {
  return unwrap(apiClient.post<ApiResponse<ProductionBatch>>('/production/start-batch', input));
}

export function finishBatch(input: FinishBatchRequest) {
  return unwrap(apiClient.post<ApiResponse<ProductionBatch>>('/production/finish-batch', input));
}
