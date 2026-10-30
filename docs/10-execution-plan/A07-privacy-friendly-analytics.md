# A07 — Đo lường không xâm phạm riêng tư

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | A — First Dollar |
| Ưu tiên | P0 |
| Ước lượng | 0,5 ngày (giai đoạn 1) + 1 ngày (giai đoạn 2, tùy chọn) |
| Phụ thuộc | A02 (privacy.html phải nêu công cụ đo trước khi bật) |
| Trạng thái | ☐ Todo |

## Mục tiêu
Biết mỗi ngày: bao nhiêu người vào trang đích/trang giá, từ nguồn nào, bao nhiêu checkout và đơn.

## Các bước
**Giai đoạn 1 (bắt buộc trước A08)**
1. Cloudflare dashboard → Web Analytics → thêm site `tasks.nexuspulsetech.xyz` (domain đã proxy → dùng snippet beacon hoặc tự động chèn).
2. Nếu dùng snippet: thêm vào `index.html` và layout Astro; CSP (B04) cho phép `static.cloudflareinsights.com` và `cloudflareinsights.com`.
3. Google Search Console: gửi `sitemap.xml`. Bing Webmaster Tools: nhập từ Search Console, gửi sitemap.
4. Bảng theo dõi phễu hằng ngày (sheet): visitor, lượt xem `#pricing`, checkout (dashboard Polar), đơn (Polar + SePay).
5. Quy ước UTM theo [../02-growth/07-analytics-and-measurement.md](../02-growth/07-analytics-and-measurement.md).

**Giai đoạn 2 (sau khách đầu tiên)**
6. `POST /v1/metrics` trên Worker: sự kiện cố định (`activated`, `retained_d7`, `paywall_view`, `checkout_click`, `sync_enabled`), không ID, không lưu IP, đếm theo ngày; client gửi tối đa 1 lần/sự kiện/ngày; công tắc tắt trong Cài đặt; cập nhật `privacy.html`.

## Tiêu chí nghiệm thu
- [ ] Dashboard Web Analytics có dữ liệu sau 24 giờ.
- [ ] Sitemap được Google & Bing chấp nhận.
- [ ] `privacy.html` nêu Cloudflare Web Analytics; không có cookie theo dõi.

## Tham chiếu
- [../01-business/08-kpis-and-unit-economics.md](../01-business/08-kpis-and-unit-economics.md)
