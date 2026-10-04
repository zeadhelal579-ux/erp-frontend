import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from './types/api';

// كل الـ Controllers الحقيقية معمول عليها [Route("api/v1/[controller]")] --
// لازم الـ base URL يشمل "/api/v1" وإلا كل طلب هيرجع 404.
// القيمة الاحتياطية للتطوير المحلي بس -- build الـ production بيفشل لو المتغير ناقص
// (راجع vite.config.ts)، فمفيش احتمال تتسرّب localhost لنسخة منشورة.
const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5182/api/v1';

// التوكن في الذاكرة فقط، مش localStorage (تقليلًا لخطر XSS). الأثر الجانبي:
// تحديث الصفحة (F5) يسجّل خروج المستخدم لحد ما يُضاف httpOnly Cookie من الباك.
let inMemoryToken: string | null = null;
export function setAuthToken(token: string | null) {
  inMemoryToken = token;
}

let onUnauthorized: (() => void) | null = null;
export function registerUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

export const apiClient = axios.create({ baseURL });

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (inMemoryToken) {
    config.headers.Authorization = `Bearer ${inMemoryToken}`;
  }
  return config;
});

/** خطأ مُطبَّع بيحمل الرسالة العربية الجاهزة من الباك إند + كود الخطأ لو موجود */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly errorCode: string | null = null
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.response?.status === 401) {
      onUnauthorized?.();
    }
    const envelope = error.response?.data;
    return Promise.reject(
      new ApiError(envelope?.message ?? 'تعذّر الاتصال بالخادم، حاول مرة أخرى', envelope?.errorCode ?? null)
    );
  }
);

/** يستخرج data من غلاف ApiResponse<T> بعد نجاح الطلب (القسم 4.3) */
export async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const { data: envelope } = await promise;
  if (!envelope.success || envelope.data === null) {
    throw new ApiError(envelope.message ?? 'حدث خطأ غير متوقع', envelope.errorCode);
  }
  return envelope.data;
}

/** true لو الخطأ ده تحديدًا تعارض RowVersion (طلبين حصلوا في نفس اللحظة) */
export function isConcurrencyConflict(err: unknown): boolean {
  return err instanceof ApiError && err.errorCode === 'CONCURRENCY_CONFLICT';
}
