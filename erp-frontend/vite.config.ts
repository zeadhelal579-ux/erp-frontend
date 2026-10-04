/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ command, mode }) => {
  // ==========================================================================
  // حماية وقت الـ build: Vite بيحقن VITE_API_BASE_URL داخل الكود وقت البناء (مش وقت
  // التشغيل). لو النسخة الـ Production اتبنت من غير المتغير ده (مثلًا على Vercel لو
  // نسيت تضيفه في Settings → Environment Variables)، التطبيق كان هيشتغل عادي لكنه
  // بصمت بيكلّم localhost:5182 من متصفح المستخدم -- فشل صامت. الأفضل إن الـ build
  // نفسه يفشل برسالة واضحة. الشرط مقصور على build الـ production (مش dev ولا vitest).
  // ==========================================================================
  if (command === 'build' && mode === 'production') {
    const env = loadEnv(mode, process.cwd(), 'VITE_');
    const apiUrl = env.VITE_API_BASE_URL;
    if (env.VITE_USE_MOCK_API === 'true') {
      // الوضع التجريبي: الواجهة شغالة على بيانات وهمية داخل المتصفح، فمفيش باك إند مطلوب.
      console.warn('[وضع تجريبي] VITE_USE_MOCK_API=true -- النسخة دي بتستخدم بيانات وهمية، مش باك إند حقيقي.');
    } else if (!apiUrl) {
      throw new Error(
        'VITE_API_BASE_URL غير مضبوط. على Vercel: Settings → Environment Variables → أضف ' +
          'VITE_API_BASE_URL بعنوان الباك إند الفعلي (مثال: https://api.example.com/api/v1) ' +
          'ثم أعد النشر (Redeploy). محليًا: انسخ .env.example إلى .env.'
      );
    } else if (apiUrl.startsWith('http://') && !/^http:\/\/(localhost|127\.0\.0\.1)/.test(apiUrl)) {
      // صفحة https لا تستطيع استدعاء API على http -- المتصفح بيحجبه (Mixed Content).
      console.warn(
        `[تحذير] VITE_API_BASE_URL يبدأ بـ http:// (${apiUrl}) -- المتصفح هيحجب الطلبات من موقع https على Vercel.`
      );
    }
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
    },
  };
});
