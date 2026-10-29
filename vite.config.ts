import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      // Service Worker sinh bởi Workbox lúc build: precache app shell kèm revision hash, tự dọn cache cũ mỗi lần deploy.
      // Tự đăng ký trong src/main.tsx (chỉ ở bản production, bỏ qua trong Tauri). Manifest giữ nguyên file public/manifest.json.
      VitePWA({
        strategies: 'generateSW',
        registerType: 'autoUpdate',
        injectRegister: false,
        manifest: false,
        includeManifestIcons: false,
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,json}'],
          globIgnores: [
            '**/og-image.png',
            '**/quan-ly-cong-viec.html',
            '**/google*.html',
            '**/stride-tasks-icon.svg',
            '**/screenshots/**',
          ],
          navigateFallback: 'index.html',
          // Các trang HTML tĩnh độc lập phải được phục vụ đúng file, không bị thay bằng index.html
          navigateFallbackDenylist: [/\/[^/?]+\.html$/, /\/sitemap\.xml$/, /\/robots\.txt$/],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    build: {
      rolldownOptions: {
        output: {
          // Tách thư viện ổn định ra chunk riêng: cache trình duyệt giữ được qua các lần deploy app
          codeSplitting: {
            groups: [
              { name: 'react-vendor', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 20 },
              { name: 'icons', test: /node_modules[\\/]lucide-react[\\/]/, priority: 10 },
              // Sync engine chỉ chạy khi người dùng bật đồng bộ → tách riêng để giữ chunk chính gọn
              { name: 'sync-engine', test: /src[\\/]features[\\/]sync[\\/](syncCrypto|syncClient|syncMerge|tombstones)/, priority: 15 },
            ],
          },
        },
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
  };
});
