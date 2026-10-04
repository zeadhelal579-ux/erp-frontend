import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // القيم دي منسوخة من الـ Theme الفعلي المعتمد في تصاميم Stitch النهائية
        // (مش القيم الأصلية المقترحة في البرومبت الأول) عشان الكود يطابق الشكل
        // المعتمد فعليًا بالظبط.
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          600: '#004ac6',
          700: '#003a9e',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', '"Segoe UI"', 'Tahoma', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
