import path from 'path';
import { defineConfig } from 'vitest/config';

// Cấu hình test tách khỏi vite.config.ts để không nạp plugin PWA/Tailwind khi chạy test
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/features/sync/**/*.ts', 'src/hooks/claimPolling.ts', 'src/utils/licenseCrypto.ts'],
      exclude: ['**/__tests__/**'],
    },
  },
});
