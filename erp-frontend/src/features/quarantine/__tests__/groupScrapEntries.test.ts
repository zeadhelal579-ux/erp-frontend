import { describe, expect, it } from 'vitest';
import { groupScrapEntries } from '../groupScrapEntries';
import type { ScrapEntry } from '@/lib/types/api';

function makeEntry(overrides: Partial<ScrapEntry>): ScrapEntry {
  return {
    id: 1,
    sourceType: 'ProductionLine',
    referenceId: 1,
    quantity: 100,
    scrapReason: 'Failed tension test',
    finalDecision: 'Pending',
    createdAt: '2026-09-02T00:00:00Z',
    ...overrides,
  };
}

describe('groupScrapEntries', () => {
  it('puts Pending entries in the "awaiting decision" group', () => {
    const entries = [makeEntry({ id: 1, finalDecision: 'Pending' })];
    const { awaitingDecision, awaitingReworkApproval } = groupScrapEntries(entries);
    expect(awaitingDecision).toHaveLength(1);
    expect(awaitingReworkApproval).toHaveLength(0);
  });

  it('puts Sent_To_Rework entries in the "awaiting rework approval" group', () => {
    const entries = [makeEntry({ id: 2, finalDecision: 'Sent_To_Rework' })];
    const { awaitingDecision, awaitingReworkApproval } = groupScrapEntries(entries);
    expect(awaitingDecision).toHaveLength(0);
    expect(awaitingReworkApproval).toHaveLength(1);
  });

  it('excludes Reworked and Destroyed entries from both groups', () => {
    // ملحوظة تصحيح مهمة: في مراجعة سابقة افترضنا غلط إن "Reworked" حالة
    // مختلَقة بالكامل. هي حقيقية فعليًا (ScrapService.ApproveReworkAsync
    // بيحطها)، بس GetPendingEntriesAsync بيفلترها برة خالص بمجرد ما تتحدد --
    // فمفيش داعي إن الفرونت يتعامل معاها هنا أصلًا، لأنها مش هترجع من الإندبوينت.
    const entries = [
      makeEntry({ id: 3, finalDecision: 'Reworked' }),
      makeEntry({ id: 4, finalDecision: 'Destroyed' }),
    ];
    const { awaitingDecision, awaitingReworkApproval } = groupScrapEntries(entries);
    expect(awaitingDecision).toHaveLength(0);
    expect(awaitingReworkApproval).toHaveLength(0);
  });

  it('correctly separates a mixed list', () => {
    const entries = [
      makeEntry({ id: 1, finalDecision: 'Pending' }),
      makeEntry({ id: 2, finalDecision: 'Sent_To_Rework' }),
      makeEntry({ id: 3, finalDecision: 'Pending' }),
    ];
    const { awaitingDecision, awaitingReworkApproval } = groupScrapEntries(entries);
    expect(awaitingDecision.map((e) => e.id)).toEqual([1, 3]);
    expect(awaitingReworkApproval.map((e) => e.id)).toEqual([2]);
  });
});
