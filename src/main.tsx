import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { LanguageProvider } from './i18n';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import './index.css';
import { registerServiceWorker } from './utils/registerServiceWorker';

// Service Worker chỉ dành cho bản web production: ở dev nó sẽ cache module của Vite gây lỗi khó hiểu,
// còn trong Tauri tài nguyên đã nằm sẵn trong app nên SW chỉ làm chậm việc nhận bản cập nhật.
// Đăng ký lỗi hay cài lỗi đều ghi console với tiền tố [sw]; cài lần đầu lỗi thì tự thử lại một lần (B11).
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
if (import.meta.env.PROD && !isTauri && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void registerServiceWorker({ container: navigator.serviceWorker, url: `${import.meta.env.BASE_URL}sw.js` });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </AppErrorBoundary>
  </StrictMode>,
);
