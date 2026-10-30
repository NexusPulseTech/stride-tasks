# C05: Microsoft Store (PWA → MSIX)

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | C: Growth engine |
| Ưu tiên | P1 |
| Ước lượng | 1-2 ngày + thời gian duyệt |
| Phụ thuộc | A05 (thanh toán chạy), A02 (privacy URL) |
| Trạng thái | ☐ Todo |
| Người làm | Founder (tài khoản Partner Center, xác minh danh tính) + kỹ sư (đóng gói) |

## Mục tiêu
Stride Tasks có trên Microsoft Store, gói MSIX do Microsoft ký (không cần chứng thư riêng), thanh toán PRO qua cổng riêng.

## Các bước
Theo hồ sơ chi tiết [../02-growth/store-listings/microsoft-store-listing.md](../02-growth/store-listings/microsoft-store-listing.md):
1. Đăng ký tài khoản nhà phát triển cá nhân (miễn phí) → giữ tên `Stride Tasks` → ghi *Package Identity Name / Publisher / Publisher display name*.
2. Kiểm tra manifest đạt yêu cầu PWABuilder (tên, icon 512, screenshots, shortcuts, service worker), chạy báo cáo tại pwabuilder.com.
3. PWABuilder → Windows → điền 3 giá trị → tải `.msixbundle`.
4. Partner Center: listing EN + VI (nội dung & từ khóa ở [../02-growth/05-app-store-optimization.md](../02-growth/05-app-store-optimization.md)), danh mục Productivity, privacy URL, tuổi 3+.
5. **Xác minh chính sách thanh toán** hiện hành trong Partner Center (app không phải game dùng commerce riêng) trước khi nộp.
6. Nộp → xử lý phản hồi chứng nhận.
7. Sau khi lên store: thêm nút "Tải trên Microsoft Store" ở trang đích; hướng dẫn người dùng chuyển dữ liệu từ trình duyệt sang bản Store bằng **Đồng bộ** hoặc xuất/nhập JSON (bản Store có bộ nhớ riêng).

## Tiêu chí nghiệm thu
- [ ] App xuất hiện khi tìm "Stride Tasks" trong Microsoft Store.
- [ ] Mua PRO và kích hoạt hoạt động trong bản Store.
- [ ] Hướng dẫn chuyển dữ liệu có trong FAQ.
