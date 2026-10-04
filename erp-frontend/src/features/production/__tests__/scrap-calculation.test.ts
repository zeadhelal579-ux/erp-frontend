import { describe, expect, it } from 'vitest';

// نفس "المعادلة الذهبية" المستخدمة في FinishBatchModal، ومطابقة حرفيًا لمعادلة
// ProductionService.FinishBatchAsync الفعلية في الباك إند:
// Scrap = Issued - (Produced + Returned)
function calculateScrap(issued: number, produced: number, returned: number) {
  return issued - (produced + returned);
}

describe('scrap calculation (golden equation)', () => {
  it('returns zero scrap when produced + returned equals issued exactly', () => {
    expect(calculateScrap(1000, 950, 50)).toBe(0);
  });

  it('calculates positive scrap when produced + returned is less than issued', () => {
    expect(calculateScrap(1000, 900, 50)).toBe(50);
  });

  it('calculates negative scrap when produced + returned exceeds issued (invalid state)', () => {
    // ده بالظبط الحالة اللي الفرونت لازم يمنع الإرسال فيها (زرار Finish Batch
    // بيتعطّل لما scrapPreview < 0 في FinishBatchModal.tsx) لأن الباك إند
    // هيرفضها على أي حال.
    expect(calculateScrap(1000, 900, 200)).toBe(-100);
  });

  it('handles zero issued quantity', () => {
    expect(calculateScrap(0, 0, 0)).toBe(0);
  });

  it('handles fractional quantities correctly', () => {
    expect(calculateScrap(100.5, 90.25, 5.25)).toBeCloseTo(5, 5);
  });
});
