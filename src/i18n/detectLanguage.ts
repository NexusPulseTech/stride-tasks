import type { Language } from './types';

export const LANGUAGE_KEY = 'stride_tasks_language';

/**
 * Ngôn ngữ khởi tạo: lựa chọn đã lưu > tham số `?lang=` (từ trang đích) > ngôn ngữ trình duyệt > tiếng Anh.
 * Mặc định tiếng Anh vì thị trường mục tiêu là quốc tế; người dùng có trình duyệt tiếng Việt vẫn thấy tiếng Việt.
 * Không phụ thuộc React để lớp lưu trữ dùng được khi tạo dữ liệu mẫu lần đầu.
 */
export function detectInitialLanguage(): Language {
  try {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    if (stored === 'en' || stored === 'vi') return stored;
  } catch (e) {}
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('lang');
    if (fromUrl === 'en' || fromUrl === 'vi') return fromUrl;
    const preferred = navigator.languages?.length ? navigator.languages : [navigator.language];
    if (preferred.some((l) => typeof l === 'string' && l.toLowerCase().startsWith('vi'))) return 'vi';
  } catch (e) {}
  return 'en';
}
