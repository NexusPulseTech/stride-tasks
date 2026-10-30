# C03 — Bản địa hóa đợt 1

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | C — Growth engine |
| Ưu tiên | P2 |
| Ước lượng | 3–5 ngày |
| Phụ thuộc | A07 (cần dữ liệu quốc gia), B08 (từ điển tách namespace) |
| Trạng thái | ☐ Todo |

## Mục tiêu
Thêm 2–3 ngôn ngữ được chọn **bằng dữ liệu**, cho app + trang đích + store listing.

## Chọn ngôn ngữ
Chấm điểm mỗi ứng viên (VD: Español, Português (BR), Bahasa Indonesia, 日本語, Deutsch) theo:
1. Lượt truy cập/impressions theo quốc gia (Web Analytics, Search Console) — trọng số cao nhất.
2. Phù hợp bậc giá PPP (thị trường mới nổi → `emerging-ppp`).
3. Mức cạnh tranh của từ khóa chính bằng ngôn ngữ đó.
4. Chi phí dịch & khả năng có người bản ngữ rà soát.

## Các bước
1. Mở rộng kiểu `Language` & từ điển (`src/i18n/types.ts` bắt buộc đủ khóa — thiếu là lỗi biên dịch).
2. Dịch máy → người bản ngữ rà soát (khách hàng/cộng đồng, có ghi công).
3. Kiểm tra UI chịu chuỗi dài, định dạng ngày/số/tiền theo `Intl`.
4. Trang đích `/{lang}/` + `hreflang`; store listing theo ngôn ngữ.

## Tiêu chí nghiệm thu
- [ ] Mỗi ngôn ngữ mới: 100% khóa app, trang đích, trang giá, listing Microsoft Store.
- [ ] Ảnh chụp màn hình ở 360 px không vỡ bố cục.
