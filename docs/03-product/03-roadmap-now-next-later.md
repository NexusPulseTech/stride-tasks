# Roadmap — Now / Next / Later

> **Thuộc**: 03-product · **Trạng thái**: Draft v1 · **Cập nhật**: 2026-10-30
> **Quy tắc**: Now = đang làm, có task chi tiết; Next = đã hiểu đủ để lên task; Later = ý tưởng, chưa cam kết. Không có ngày cố định cho Later.

## Now — Phase A "First Dollar" (mục tiêu: khách trả tiền đầu tiên)

| Hạng mục | Task |
| :--- | :--- |
| Sửa thương hiệu & SEO metadata | A01 |
| Điều khoản + hoàn tiền | A02 |
| MoR quốc tế (Polar) + VietQR | A03, A05 |
| Hợp đồng thanh toán an toàn (claim secret, hoàn tiền → thu hồi, rate limit) | A04 |
| Trang đích + trang giá EN/VI | A06 |
| Đo lường không xâm phạm riêng tư | A07 |
| Sprint outreach 14 ngày | A08 |

## Next — Phase B "Foundation" (song song, không chặn bán)

Test trong repo (B01) · ESLint/Prettier/TS strict (B02) · CI quality gates (B03) · Error Boundary + CSP (B04) · Worker TypeScript + kiến trúc lục giác (B05) · Gói hợp đồng dùng chung (B06) · CI/CD Worker + staging + quan sát (B07) · Tách module quá lớn (B08).

## Next — Phase C "Growth engine"

Site marketing SSG + i18n (C01) · Trụ cột nội dung & trang so sánh (C02) · Bản địa hóa đợt 1 (C03) · Product Hunt / Show HN (C04) · Microsoft Store (C05) · Google Play TWA + Play Billing (C06).

## Later — Phase D "Scale"

Tách dịch vụ + monorepo (D01) · Pipeline phát hành desktop có ký số & auto-update (D02) · Đánh giá nền tảng Apple (D03) · Tiến hóa mô hình giá/thuê bao (D04) · Quyết định giấy phép mã nguồn (D05).

## Ý tưởng chưa cam kết (cần tín hiệu từ khách hàng)

- Web Push nhắc lịch ôn khi app đóng.
- Đồng bộ thời gian thực (Durable Objects) thay cho kéo định kỳ 60 giây.
- Nhập từ Todoist/TickTick/Anki.
- Tích hợp lịch (ICS).

Mỗi ý tưởng chỉ được chuyển lên Next khi có **≥ 3 khách trả tiền** hoặc **≥ 10 người dùng hoạt động** yêu cầu độc lập.
