import { apiClient, unwrap } from '@/lib/api-client';
import type { ApiResponse, ProductionBatch, ScrapDecisionRequest, ScrapEntry } from '@/lib/types/api';

// كل المسارات دي منسوخة حرفيًا من ScrapController.cs الفعلي.
// GetPendingEntriesAsync بيرجّع Pending + Sent_To_Rework سوا -- بمجرد ما سطر
// يبقى "Reworked" أو "Destroyed" بيختفي من هنا تلقائيًا، فمفيش داعي لأي منطق
// إضافي في الفرونت للتعامل مع حالة "Reworked" -- مش هترجع من هنا أبدًا.

export function fetchPendingScrapEntries() {
  return unwrap(apiClient.get<ApiResponse<ScrapEntry[]>>('/scrap/pending'));
}

export function qualityDecision(input: ScrapDecisionRequest) {
  return unwrap(apiClient.post<ApiResponse<ScrapEntry>>('/scrap/quality-decision', input));
}

/** approve-rework بياخد الـ id كـ route param، من غير أي body */
export function approveRework(scrapEntryId: number) {
  return unwrap(
    apiClient.post<ApiResponse<ProductionBatch>>(`/scrap/approve-rework/${scrapEntryId}`)
  );
}
