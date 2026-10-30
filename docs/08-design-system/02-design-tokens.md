# Design tokens

> **Thuộc**: 08-design-system · **Trạng thái**: Draft v1 · **Cập nhật**: 2026-10-30
> **Vấn đề cần giải**: màu viết thẳng `slate-*` + `dark:` lặp lại ~1.100 lần → đổi thương hiệu/độ tương phản phải sửa hàng trăm chỗ.

## 1. Mô hình 3 tầng (theo Material 3 / Primer)

| Tầng | Vai trò | Ví dụ |
| :--- | :--- | :--- |
| **Reference** (nguyên liệu) | Bảng màu thô, thang kích thước | `--ref-slate-50 … --ref-slate-950`, `--ref-red-600` |
| **System / Semantic** (ý nghĩa) | Gán ý nghĩa, đổi theo chế độ sáng/tối | `--color-surface`, `--color-surface-raised`, `--color-text`, `--color-text-muted`, `--color-border`, `--color-accent`, `--color-danger`, `--color-success`, `--color-focus-ring` |
| **Component** (tùy chọn) | Ngoại lệ cho một component | `--button-primary-bg` (mặc định = `--color-accent`) |

**Component chỉ dùng tầng semantic** (hoặc component). Không dùng `slate-400` trực tiếp trong TSX mới.

## 2. Hiện thực với Tailwind v4

```css
/* src/styles/tokens.css */
@theme {
  --color-surface: var(--sys-surface);
  --color-surface-raised: var(--sys-surface-raised);
  --color-text: var(--sys-text);
  --color-text-muted: var(--sys-text-muted);
  --color-border: var(--sys-border);
  --color-accent: var(--sys-accent);
  --radius-control: 0.5rem;
  --radius-card: 0.75rem;
}
:root {
  --sys-surface: #ffffff;  --sys-surface-raised: #f8fafc;
  --sys-text: #0f172a;     --sys-text-muted: #64748b;
  --sys-border: #e2e8f0;   --sys-accent: #dc2626;   /* đỏ thương hiệu Stride */
}
.dark {
  --sys-surface: #0b0f17;  --sys-surface-raised: #111827;
  --sys-text: #e2e8f0;     --sys-text-muted: #94a3b8;
  --sys-border: #1e293b;
}
```

Component viết `bg-surface text-text-muted border-border` — **một** class cho cả hai chế độ, bỏ được cặp `dark:`.
*(Giá trị màu trên là minh họa, lấy chính xác từ [color-system-and-palette.md](./color-system-and-palette.md) và logo đỏ của commit `07a92ee` khi triển khai.)*

## 3. Bảng token tối thiểu

| Nhóm | Token |
| :--- | :--- |
| Bề mặt | `surface`, `surface-raised`, `surface-sunken`, `overlay` |
| Chữ | `text`, `text-muted`, `text-subtle`, `text-on-accent` |
| Đường viền | `border`, `border-strong`, `focus-ring` |
| Ngữ nghĩa | `accent`, `success`, `warning`, `danger`, `info` (mỗi cái có `-subtle` cho nền) |
| Trạng thái việc | `status-todo`, `status-doing`, `status-review`, `status-done` |
| Khoảng cách | thang 4pt: `1`=4px, `2`=8px, `3`=12px, `4`=16px, `6`=24px, `8`=32px |
| Bo góc | `radius-control`, `radius-card`, `radius-pill` |
| Bóng | `shadow-raised`, `shadow-overlay` |
| Chuyển động | `duration-fast` 150 ms, `duration-base` 200 ms, `ease-standard` |
| Chữ | `font-system` (đã có), cỡ `text-xs … text-xl`, `leading-*` |

## 4. Di chuyển (không big bang)

1. Thêm `tokens.css` và các class semantic — không đổi giao diện.
2. Component **mới** bắt buộc dùng token; component cũ đổi dần khi chạm vào (task B08).
3. Lint cảnh báo màu thô (`slate-`, `gray-`) trong file đã chuyển.
4. Khi xong: xuất token sang gói `packages/design-tokens` để dùng chung với `site/` (Astro).

Định dạng trao đổi token (nếu dùng công cụ thiết kế): JSON theo đặc tả Design Tokens của W3C Community Group (DTCG).
