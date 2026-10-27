import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { LanguageProvider } from './i18n';
import './index.css';

// Service Worker chỉ dành cho bản web production: ở dev nó sẽ cache module của Vite gây lỗi khó hiểu,
// còn trong Tauri tài nguyên đã nằm sẵn trong app nên SW chỉ làm chậm việc nhận bản cập nhật.
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
if (import.meta.env.PROD && !isTauri && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // Trình duyệt chặn SW (chế độ riêng tư / http) → app vẫn chạy bình thường, chỉ không có offline cache
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
);
