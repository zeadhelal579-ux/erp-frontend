import { AxiosError, type AxiosAdapter, type AxiosResponse } from 'axios';
import { handleMockRequest } from './handler';

// Adapter بديل لـ axios: بدل ما الطلب يخرج على الشبكة، بيتنفّذ على الباك إند الوهمي
// داخل المتصفح. بيرجّع نفس شكل الرد/الخطأ اللي axios بيرجّعه للسيرفر الحقيقي، فالـ
// interceptors وunwrap وكل شاشات الـ features بتشتغل من غير أي تعديل.

const LATENCY_MS = 300; // تأخير بسيط عشان حالات Loading تبان زي الحقيقي

function parseBody(data: unknown): unknown {
  if (typeof data !== 'string') return data ?? null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export const mockAdapter: AxiosAdapter = async (config) => {
  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));

  const authHeader = config.headers.get('Authorization');
  const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  let path = config.url ?? '';
  if (config.baseURL && path.startsWith(config.baseURL)) path = path.slice(config.baseURL.length);

  const reply = handleMockRequest({
    method: config.method ?? 'get',
    path,
    params: config.params as Record<string, unknown> | undefined,
    body: parseBody(config.data),
    token,
  });

  const response: AxiosResponse = {
    data: reply.envelope,
    status: reply.status,
    statusText: reply.status < 400 ? 'OK' : 'Error',
    headers: {},
    config,
    request: {},
  };

  if (reply.status >= 400) {
    throw new AxiosError(
      reply.envelope.message ?? 'Request failed',
      reply.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
      config,
      null,
      response
    );
  }
  return response;
};
