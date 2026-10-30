import { cloudflareTest } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

// Test chạy trong runtime Workers thật (Miniflare); binding cục bộ khai báo ở wrangler.test.toml
export default defineConfig({
  plugins: [cloudflareTest({ wrangler: { configPath: './wrangler.test.toml' } })],
  test: {
    include: ['test/**/*.test.js'],
  },
});
