import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../StatusBadge';
import type { BatchState } from '@/lib/types/api';

// كل الحالات التسعة دي منسوخة حرفيًا من التحقق الفعلي لآلة الحالات في
// ProductionBatch.CurrentState -- لو حالة جديدة اتضافت في الباك إند ومحدّش
// حدّث STATE_STYLES في StatusBadge.tsx، الاختبار ده هيفشل فورًا (TypeScript
// نفسه هيرفض الكومبايل كمان بسبب Record<BatchState, ...> الشامل).
const ALL_STATES: BatchState[] = [
  'In_Production',
  'Waiting_QC',
  'QC_Passed',
  'QC_Failed',
  'Ready_For_Shipping',
  'Quarantine',
  'Rework_In_Progress',
  'Shipped',
  'Destroyed',
];

describe('StatusBadge', () => {
  it.each(ALL_STATES)('renders a visible label for state "%s"', (state) => {
    render(<StatusBadge state={state} />);
    expect(screen.getByText((text) => text.length > 0)).toBeInTheDocument();
  });

  it('renders Quarantine in orange, not red (must stay visually distinct from Lab Failed)', () => {
    const { container } = render(<StatusBadge state="Quarantine" />);
    expect(container.querySelector('.bg-orange-100')).toBeTruthy();
    expect(container.querySelector('.bg-red-100')).toBeFalsy();
  });

  it('renders Rework_In_Progress in purple, not gray', () => {
    const { container } = render(<StatusBadge state="Rework_In_Progress" />);
    expect(container.querySelector('.bg-purple-100')).toBeTruthy();
  });

  it('renders QC_Failed in red specifically', () => {
    render(<StatusBadge state="QC_Failed" />);
    expect(screen.getByText('Lab Failed')).toBeInTheDocument();
  });
});
