import { apiClient, unwrap } from '@/lib/api-client';
import type { ApiResponse, BatchSummary, ManagerDecisionRequest, ProductionBatch } from '@/lib/types/api';

// ==========================================================================
// اكتشاف مهم أثناء المراجعة: ManagerService.GetPendingApprovalsAsync() بيرجّع
// IEnumerable<BatchSummaryDto> (Id, BatchNumber, ProductId, ProducedQty,
// ExpiryDate, CreatedAt فقط) مفلترة على CurrentState == "QC_Passed" حصريًا --
// لا يوجد حقل Lab Result ولا Lab Notes في الرد أصلًا، ولا يظهر أي QC_Failed
// خالص، رغم إن MakeDecisionAsync نفسه بيسمح بالرفض من QC_Passed أو QC_Failed
// الاتنين. النتيجة: تشغيلة راسبة معمليًا مفيش أي طريق واجهة تكتشف بيها إنها
// موجودة أصلًا حاليًا. راجع تفاصيل هذه الفجوة في التقرير المرفق.
// ==========================================================================

export function fetchPendingApprovals() {
  return unwrap(apiClient.get<ApiResponse<BatchSummary[]>>('/manager/pending-approvals'));
}

export function makeDecision(input: ManagerDecisionRequest) {
  return unwrap(apiClient.post<ApiResponse<ProductionBatch>>('/manager/decision', input));
}
