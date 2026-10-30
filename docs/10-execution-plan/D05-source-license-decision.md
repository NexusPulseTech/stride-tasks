# D05: Quyết định giấy phép mã nguồn

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | D: Scale (nên quyết sớm, trước khi launch lớn) |
| Ưu tiên | P2 |
| Ước lượng | 0,5 ngày (sau khi founder chọn) |
| Phụ thuộc | Founder quyết định ADR-0008 |
| Trạng thái | ☐ Todo |

## Mục tiêu
Giấy phép cho các phiên bản tiếp theo phản ánh chiến lược kinh doanh (MIT / AGPL-3.0 / source-available có thời hạn).

## Các bước
1. Founder chọn phương án trong [../04-architecture/adr/0008-source-license-strategy.md](../04-architecture/adr/0008-source-license-strategy.md) (khuyến nghị tham vấn pháp lý).
2. Nếu đổi: cập nhật `LICENSE`, README (mục Bản quyền), header giấy phép trong `package.json`; ghi rõ "mã từ phiên bản X trở đi"; mã đã phát hành vẫn theo MIT.
3. Thông báo trong release notes và README.
4. ADR-0008 → Accepted.

## Tiêu chí nghiệm thu
- [ ] `LICENSE`, README, `package.json` nhất quán; ADR Accepted.
