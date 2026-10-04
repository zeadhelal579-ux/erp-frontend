// ==========================================================================
// Stub محلي لأغراض التحقق الثابت (tsc) في بيئات من غير إنترنت بس -- مش جزء من الـ build.
// اتنقل برة src/ عمدًا: أي `declare module 'axios'` جوه src/ بيتقدّم على أنواع الحزمة
// الحقيقية وبيغطّي عليها. بيُستخدم فقط من tsconfig.purecheck.json.
// ==========================================================================
declare module 'axios' {
  export interface AxiosRequestConfig {
    params?: Record<string, unknown>;
    headers?: Record<string, string>;
  }
  export interface InternalAxiosRequestConfig extends AxiosRequestConfig {
    headers: Record<string, string> & { Authorization?: string };
  }
  export interface AxiosResponse<T = unknown> {
    data: T;
    status: number;
  }
  export interface AxiosError<T = unknown> extends Error {
    response?: AxiosResponse<T>;
    isAxiosError: boolean;
  }
  export interface AxiosInstance {
    get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    interceptors: {
      request: { use(onFulfilled: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig): void };
      response: {
        use<T = unknown>(
          onFulfilled: (response: AxiosResponse) => AxiosResponse,
          onRejected: (error: AxiosError<T>) => Promise<never>
        ): void;
      };
    };
  }
  interface AxiosStatic {
    create(config?: { baseURL: string }): AxiosInstance;
  }
  const axios: AxiosStatic;
  export default axios;
}
