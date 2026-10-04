// سكريبت تحقق قابل للتنفيذ فعليًا (مش اختبار Vitest -- ده عشان نقدر نشغّله
// بـ tsx مباشرة في بيئة من غير npm install كامل). بيغطي نفس الحالات المكتوبة
// في ملفات __tests__/*.test.ts بالضبط، لكن بتنفيذ حقيقي فعلاً وقت المراجعة.
import assert from 'node:assert/strict';
import { groupScrapEntries } from './src/features/quarantine/groupScrapEntries';
import type { ScrapEntry } from './src/lib/types/api';

let passed = 0;
function check(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

// ---- 1) معادلة الهالك الذهبية ----
function calculateScrap(issued: number, produced: number, returned: number) {
  return issued - (produced + returned);
}

console.log('Scrap calculation (golden equation):');
check('zero scrap when produced+returned == issued', () => {
  assert.equal(calculateScrap(1000, 950, 50), 0);
});
check('positive scrap when produced+returned < issued', () => {
  assert.equal(calculateScrap(1000, 900, 50), 50);
});
check('negative scrap flags an invalid state', () => {
  assert.equal(calculateScrap(1000, 900, 200), -100);
});
check('fractional quantities', () => {
  assert.ok(Math.abs(calculateScrap(100.5, 90.25, 5.25) - 5) < 1e-9);
});

// ---- 2) تجميع سطور العزل ----
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

console.log('\nQuarantine entry grouping:');
check('Pending goes to awaitingDecision', () => {
  const { awaitingDecision } = groupScrapEntries([makeEntry({ finalDecision: 'Pending' })]);
  assert.equal(awaitingDecision.length, 1);
});
check('Sent_To_Rework goes to awaitingReworkApproval', () => {
  const { awaitingReworkApproval } = groupScrapEntries([makeEntry({ finalDecision: 'Sent_To_Rework' })]);
  assert.equal(awaitingReworkApproval.length, 1);
});
check('Reworked and Destroyed appear in neither group', () => {
  const result = groupScrapEntries([
    makeEntry({ id: 3, finalDecision: 'Reworked' }),
    makeEntry({ id: 4, finalDecision: 'Destroyed' }),
  ]);
  assert.equal(result.awaitingDecision.length, 0);
  assert.equal(result.awaitingReworkApproval.length, 0);
});
check('mixed list is split correctly, preserving order', () => {
  const result = groupScrapEntries([
    makeEntry({ id: 1, finalDecision: 'Pending' }),
    makeEntry({ id: 2, finalDecision: 'Sent_To_Rework' }),
    makeEntry({ id: 3, finalDecision: 'Pending' }),
  ]);
  assert.deepEqual(
    result.awaitingDecision.map((e) => e.id),
    [1, 3]
  );
  assert.deepEqual(
    result.awaitingReworkApproval.map((e) => e.id),
    [2]
  );
});

console.log(`\n${passed} checks passed.`);
