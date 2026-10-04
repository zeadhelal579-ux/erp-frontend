import type { ScrapEntry } from '@/lib/types/api';

/**
 * الإندبوينت الحقيقي (/scrap/pending) بيرجّع بس الحالات "Pending" و
 * "Sent_To_Rework" -- بمجرد ما سطر يتحول لـ "Reworked" أو "Destroyed" بيختفي
 * من الرد نفسه. الدالة دي بتوزّع اللي راجع فعليًا على القسمين المرئيين، من
 * غير أي افتراض بوجود حالات تانية.
 */
export function groupScrapEntries(entries: ScrapEntry[]) {
  return {
    awaitingDecision: entries.filter((e) => e.finalDecision === 'Pending'),
    awaitingReworkApproval: entries.filter((e) => e.finalDecision === 'Sent_To_Rework'),
  };
}
