# Ngân sách hiệu năng

> **Thuộc**: 07-engineering · **Trạng thái**: Accepted · **Cập nhật**: 2026-10-30
> **Số đo gốc**: `npm run build` v3.1.0 (Vite 8.3.4), production `f02b195`.

## 1. Số đo hiện tại

| Tài nguyên | Kích thước | Gzip |
| :--- | ---: | ---: |
| `index-*.js` (chunk chính) | 415,81 kB | 98,85 kB |
| `react-vendor-*.js` | 218,75 kB | 68,27 kB |
| `index-*.css` | 122,14 kB | 17,06 kB |
| `icons-*.js` | 20,32 kB | 6,84 kB |
| `sync-engine-*.js` (tải sớm vì `useTaskCRUD` dùng `tombstones`) | 8,84 kB | 3,59 kB |
| Modal lazy lớn nhất (`StatsPanel`) | 29,91 kB | 7,13 kB |
| Precache Service Worker | 24 mục | 973,07 KiB |

## 2. Ngân sách (CI chặn khi vượt — task B03)

| Hạng mục | Ngân sách cứng | Mục tiêu |
| :--- | ---: | ---: |
| Chunk chính (raw) | **≤ 470 kB** | ≤ 400 kB |
| Mỗi chunk lazy (raw) | ≤ 35 kB | ≤ 30 kB |
| CSS (raw) | ≤ 135 kB | ≤ 120 kB |
| Precache Service Worker | ≤ 1,2 MiB | ≤ 1,0 MiB |
| Trang marketing (JS) | ≤ 50 kB | 0–10 kB (Astro mặc định không JS) |

## 3. Core Web Vitals (đo p75 thực tế)

| Chỉ số | Ngưỡng "Good" |
| :--- | :--- |
| LCP | ≤ 2,5 s |
| INP | ≤ 200 ms |
| CLS | ≤ 0,1 |

Lighthouse mobile ≥ 90 Performance cho trang marketing; app ≥ 80 (SPA nặng hơn).

## 4. Cách kiểm

- Script Node đọc `dist/assets/*` sau build, so với bảng mục 2, thoát mã lỗi khi vượt.
- Thêm thư viện mới → ghi rõ kích thước gzip trong PR.
- Ưu tiên `React.lazy` cho màn hình/modal không cần ở khung hình đầu (đã áp dụng cho 10 modal/view).
