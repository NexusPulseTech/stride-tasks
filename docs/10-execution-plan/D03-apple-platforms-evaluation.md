# D03 — Đánh giá nền tảng Apple (iOS / macOS)

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | D — Scale |
| Ưu tiên | P3 |
| Ước lượng | 0,5 ngày đánh giá |
| Điều kiện bắt đầu | Doanh thu ≥ $500/tháng **hoặc** ≥ 30% khách hỏi bản iOS/macOS |
| Trạng thái | ☐ Todo |

## Mục tiêu
Quyết định có/không đầu tư Apple, ghi thành ADR.

## Phương án
| Phương án | Chi phí | Rủi ro |
| :--- | :--- | :--- |
| Giữ PWA (Thêm vào Màn hình chính) | $0 | Hạn chế thông báo/nhận diện trên iOS |
| macOS DMG (Tauri) có notarization | $99/năm Apple Developer | Thấp |
| iOS App Store (Tauri 2 iOS) + IAP | $99/năm + 15% (Small Business Program) | Guideline 4.2 với app bọc web; bắt buộc IAP ngoài Mỹ; chính sách link ngoài tại Mỹ đang tranh tụng |

## Các bước
1. Đọc lại chính sách App Store hiện hành (IAP, link ngoài, 4.2) tại thời điểm đánh giá.
2. Ước tính doanh thu tăng thêm vs chi phí + công sức bảo trì.
3. Viết ADR với quyết định và điều kiện xem lại.

## Tiêu chí nghiệm thu
- [ ] ADR được Accepted/Rejected có số liệu.
