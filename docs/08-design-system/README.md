# 08 — Design System

> **Thuộc**: 08-design-system · **Trạng thái**: Draft v1 · **Cập nhật**: 2026-10-30
> **Tôn chỉ**: học *tư duy* của các hệ thiết kế lớn — Apple HIG (rõ ràng, nhường chỗ cho nội dung), Material 3 (token 3 tầng), GitHub Primer & IBM Carbon (token ngữ nghĩa, accessibility là mặc định), Atlassian (thiết kế nội dung) — không sao chép giao diện của họ.

## Hiện trạng (đo trong code v3.1.0)

- Tailwind v4, chế độ tối bằng `@custom-variant dark` → **1.101 lần** dùng `dark:` trong TSX; màu dùng thẳng bảng `slate-*` (VD `text-slate-400` 362 lần) — **chưa có token ngữ nghĩa**.
- `src/components/ui/` mới có `PortalMenu`, `HighlightedText`, `icon-system` — **chưa có** primitive Button/Input/Dialog/Badge → mỗi component tự style.
- Đã có quy chuẩn màu tinh gọn & lớp nổi (các file bên dưới).

## Danh mục

| File | Nội dung |
| :--- | :--- |
| [01-design-principles.md](./01-design-principles.md) | 6 nguyên lý thiết kế của Stride |
| [02-design-tokens.md](./02-design-tokens.md) | Token 3 tầng, đặt tên, hiện thực bằng Tailwind v4 `@theme` + CSS variables |
| [03-components-and-patterns.md](./03-components-and-patterns.md) | Danh mục primitive, trạng thái, mẫu tương tác |
| [04-accessibility.md](./04-accessibility.md) | Checklist WCAG 2.2 AA, lỗi hiện có |
| [05-content-and-voice.md](./05-content-and-voice.md) | Giọng văn, UX writing, quy tắc i18n, thuật ngữ |
| [color-system-and-palette.md](./color-system-and-palette.md) | **Chuẩn màu chính thức** (quy tắc 60-30-10, chống "rainbow slop") |
| [color-system-research.md](./color-system-research.md) | Ghi chú nghiên cứu màu ban đầu — nội dung trùng một phần với file chuẩn, sẽ gộp |
| [notion-hierarchy-ux.md](./notion-hierarchy-ux.md) | Cây việc con kiểu Notion, lưới 4pt/8pt |
| [portal-layering.md](./portal-layering.md) | React Portal & thang z-index |
