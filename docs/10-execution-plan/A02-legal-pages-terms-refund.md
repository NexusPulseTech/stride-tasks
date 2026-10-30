# A02: Trang Điều khoản, Hoàn tiền & cập nhật Quyền riêng tư

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | A: First Dollar |
| Ưu tiên | P0 (chặn bán, MoR yêu cầu) |
| Ước lượng | 0,5 ngày |
| Phụ thuộc | - |
| Trạng thái | ☐ Todo |

## Mục tiêu
Có `public/terms.html` và `public/refund.html` (EN + VI), `privacy.html` liệt kê đúng các bên xử lý dữ liệu; liên kết từ footer app và trang đích.

## Vì sao
Polar/Paddle và các store yêu cầu điều khoản, chính sách hoàn tiền, chính sách quyền riêng tư công khai trước khi duyệt người bán. Hiện chỉ có `privacy.html`.

## Phạm vi
- Trong: 2 trang mới, cập nhật `privacy.html`, link ở `src/components/layout/AppFooter.tsx`, thêm vào `sitemap.xml`.
- Ngoài: tư vấn pháp lý (founder tự rà soát hoặc nhờ luật sư, xem [../01-business/06-legal-tax-compliance.md](../01-business/06-legal-tax-compliance.md)).

## Các bước
1. `terms.html`: mục tối thiểu: phạm vi giấy phép sử dụng; định nghĩa **PRO trọn đời** (gồm gì, kéo dài bao lâu, giới hạn `SYNC_MAX_VAULTS_PER_LICENSE` kho/bản quyền, cấm chia sẻ/bán lại token); trách nhiệm sao lưu dữ liệu của người dùng & miễn trừ mất dữ liệu; dịch vụ đồng bộ "as is" + quyền ngừng dịch vụ có báo trước; thanh toán qua MoR là người bán hợp pháp; luật áp dụng; liên hệ.
2. `refund.html`: hoàn tiền **14 ngày không cần lý do**; cách yêu cầu (email hỗ trợ + mã đơn); thời gian xử lý; sau hoàn tiền tính năng đồng bộ bị thu hồi.
3. `privacy.html`: thêm: Polar (MoR), SePay/ngân hàng (VietQR), Cloudflare (Workers, D1, KV, Web Analytics), dịch vụ email (nếu bật); chuyển dữ liệu ra nước ngoài; quyền theo PDPL Việt Nam & GDPR; phiên bản tiếng Việt.
4. Dùng cùng khung HTML/CSS với `privacy.html` (nhất quán, không thêm framework).
5. Footer app: thêm link Terms · Refund cạnh Privacy (chuỗi qua i18n).
6. `sitemap.xml`: thêm 2 URL.

## Tiêu chí nghiệm thu
- [ ] 3 trang trả 200, có nội dung EN và VI, `lang` đúng từng phần.
- [ ] Footer app có 3 link, hoạt động cả online và offline (trang được precache).
- [ ] Nội dung khớp thực tế kỹ thuật (đối chiếu [../06-security-privacy/03-privacy-and-data-protection.md](../06-security-privacy/03-privacy-and-data-protection.md)).
- [ ] Ngày hiệu lực ghi rõ ở đầu mỗi trang.

## Xác minh
`for p in terms refund privacy; do curl -s -o /dev/null -w "%{http_code} $p\n" https://tasks.nexuspulsetech.xyz/$p.html; done`

## Rủi ro & rollback
Nội dung pháp lý chưa được luật sư rà soát → ghi "Phiên bản 1.0" và cập nhật khi có tư vấn.

## Tham chiếu
- [../01-business/06-legal-tax-compliance.md](../01-business/06-legal-tax-compliance.md)
