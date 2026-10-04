import { apiClient, unwrap } from '@/lib/api-client';
import type { ApiResponse, BatchSummary, CreateShipmentRequest, PagedResult, ShipmentRecord } from '@/lib/types/api';

// كل المسارات دي منسوخة حرفيًا من ShippingController.cs الفعلي.

export function fetchReadyToShip() {
  return unwrap(apiClient.get<ApiResponse<BatchSummary[]>>('/shipping/ready'));
}

export function fetchShipmentHistory(page: number, pageSize = 10) {
  return unwrap(
    apiClient.get<ApiResponse<PagedResult<ShipmentRecord>>>('/shipping/all', {
      params: { page, pageSize },
    })
  );
}

// مفيش shippingDate هنا -- الباك إند بيسجّل DateTime.UtcNow تلقائيًا وقت الإنشاء.
export function createShipment(input: CreateShipmentRequest) {
  return unwrap(apiClient.post<ApiResponse<ShipmentRecord>>('/shipping/create', input));
}
