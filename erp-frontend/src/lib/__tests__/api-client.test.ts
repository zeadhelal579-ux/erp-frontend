import { describe, expect, it } from 'vitest';
import { ApiError, isConcurrencyConflict, unwrap } from '../api-client';
import type { ApiResponse } from '../types/api';

function makeResponse<T>(envelope: ApiResponse<T>) {
  return Promise.resolve({ data: envelope });
}

describe('unwrap', () => {
  it('returns data when success is true', async () => {
    const result = await unwrap(
      makeResponse<{ id: number }>({ success: true, data: { id: 42 }, errorCode: null, message: null })
    );
    expect(result).toEqual({ id: 42 });
  });

  it('throws ApiError with the backend message when success is false', async () => {
    await expect(
      unwrap(
        makeResponse({
          success: false,
          data: null,
          errorCode: 'INSUFFICIENT_QUANTITY',
          message: 'الكمية المطلوبة أكبر من المتاح',
        })
      )
    ).rejects.toThrow('الكمية المطلوبة أكبر من المتاح');
  });

  it('throws ApiError even when success is true but data is null', async () => {
    // حالة دفاعية: العقد بيقول Data ممكن تبقى null حتى لو success=true
    // (نادر لكن ممكن)، لازم يتعامل معاها زي فشل عادي بدل ما يرجّع null بصمت.
    await expect(
      unwrap(makeResponse({ success: true, data: null, errorCode: null, message: null }))
    ).rejects.toThrow(ApiError);
  });
});

describe('isConcurrencyConflict', () => {
  it('returns true only for ApiError with CONCURRENCY_CONFLICT code', () => {
    expect(isConcurrencyConflict(new ApiError('conflict', 'CONCURRENCY_CONFLICT'))).toBe(true);
    expect(isConcurrencyConflict(new ApiError('not found', 'MATERIAL_NOT_FOUND'))).toBe(false);
    expect(isConcurrencyConflict(new Error('plain error'))).toBe(false);
    expect(isConcurrencyConflict('a string, not even an Error')).toBe(false);
  });
});
