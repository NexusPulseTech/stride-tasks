# Kênh phân phối (bán ở đâu)

> **Thuộc**: 01-business · **Trạng thái**: Draft v1 · **Cập nhật**: 2026-10-30
> **Mục đích**: xếp hạng nơi đặt sản phẩm theo *chi phí – phí trên doanh thu – công sức – luật thanh toán*, để làm đúng thứ tự.

## 1. Ma trận kênh

| Kênh | Chi phí vào cửa | Phí trên doanh thu | Luật thanh toán cho hàng số | Công sức | Ưu tiên |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Web trực tiếp** (`tasks.nexuspulsetech.xyz`, PWA) | 0 | Chỉ phí MoR (~7–9%) | Tự do | Thấp (đã có) | **P0** |
| **Microsoft Store** (PWA → MSIX qua PWABuilder) | **Miễn phí** cho cá nhân (từ 06/2025) | **0%** nếu app không phải game dùng cổng thanh toán riêng; 15% nếu dùng commerce của Microsoft | Cho phép thanh toán riêng (app không phải game) — *xác minh lại trong Partner Center trước khi nộp* | Thấp–trung bình | **P1** |
| **Google Play** (TWA qua Bubblewrap/PWABuilder) | $25 một lần; tài khoản cá nhân mới phải **closed test ≥ 12 tester × 14 ngày** | Phí dịch vụ Play (15% cho $1M đầu/năm theo chính sách cũ; lịch phí 2026 đang thay đổi — xác minh) | Hàng số trong app **phải dùng Google Play Billing** (trừ chương trình external link/alt billing theo khu vực, có phí) | Trung bình–cao (Digital Goods API) | **P2** |
| **Apple App Store** | $99/năm | 15% (Small Business Program) | IAP bắt buộc ngoài Mỹ; tại Mỹ link mua ngoài hiện chưa bị thu phí (đang tranh tụng) | Cao (rủi ro guideline 4.2 với app bọc web) | **P3** |
| macOS (Tauri DMG trực tiếp) | $99/năm (notarization) | 0% | Tự do | Trung bình | P3 |
| Linux (Flathub / Snap / AppImage) | 0 | 0% | Tự do | Trung bình | P3 (sau khi launch HN) |
| Windows (Tauri .exe/.msi trực tiếp) | Chứng thư ký số (tốn phí) | 0% | Tự do | Trung bình | P3 — ưu tiên Microsoft Store thay vì tự ký |

## 2. Vì sao Microsoft Store là kênh thứ hai "rẻ mà lợi"

- Đăng ký tài khoản cá nhân **miễn phí**.
- Gói **MSIX được Microsoft ký lại miễn phí** khi phát hành → không cần mua chứng thư ký số, không bị SmartScreen cảnh báo như file `.exe` tự build (bản Tauri hiện **chưa ký**).
- App không phải game được dùng cổng thanh toán riêng (Polar/VietQR) và giữ 100% doanh thu.
- Store là kênh tìm kiếm tự nhiên trên Windows — nơi sinh viên Việt Nam dùng phổ biến.
- Hồ sơ listing đã soạn sẵn: [../02-growth/store-listings/microsoft-store-listing.md](../02-growth/store-listings/microsoft-store-listing.md).

> Lưu ý kỹ thuật: Store chỉ tự ký gói **MSIX/AppX**. Nếu nộp **MSI/EXE** (Tauri) thì phải tự ký Authenticode trước → không phù hợp giai đoạn đầu.

## 3. Google Play — làm sau, nhưng làm đúng

- PWA đóng gói TWA phải có `/.well-known/assetlinks.json` khớp SHA-256 của khóa ký để ẩn thanh URL.
- Bán PRO **trong** app Android phải đi qua Google Play Billing (TWA hỗ trợ qua **Digital Goods API**). Không được điều hướng người dùng sang web để mua ở hầu hết khu vực → cần nhánh code riêng cho Play (task `C06`).
- Rào cản 12 tester × 14 ngày: chuẩn bị nhóm tester từ khách hàng đầu tiên/cộng đồng trước khi đăng ký.

## 4. Apple — đánh giá sau khi có doanh thu

Phí $99/năm + yêu cầu IAP + rủi ro bị từ chối vì "chỉ là website bọc lại" (guideline 4.2). Người dùng iPhone vẫn dùng được **PWA** (Thêm vào Màn hình chính). Đánh giá lại ở task `D03` khi doanh thu ≥ $500/tháng hoặc ≥ 30% khách hỏi bản iOS.

## 5. Kênh khám phá (không phải store nhưng mang khách)

| Kênh | Loại | Khi nào |
| :--- | :--- | :--- |
| AlternativeTo (alternative to Todoist/TickTick/Focus To-Do) | Thư mục | Ngay khi có trang đích EN |
| Product Hunt | Ngày ra mắt | Sau khi có 5–10 khách & testimonial (task `C04`) |
| Show HN (Hacker News) | Cộng đồng | Khi có câu chuyện kỹ thuật (E2E sync trên free tier, local-first) |
| Indie Hackers, SaaSHub | Cộng đồng/thư mục | Song song |
| Microsoft Store | Store | P1 |

## 6. Thứ tự triển khai

1. Web trực tiếp + thanh toán (Phase A).
2. Microsoft Store (task `C05`) — có thể bắt đầu song song ngay khi Phase A xong.
3. Google Play TWA + Play Billing (task `C06`).
4. Linux/macOS/Apple (Phase D).

## Nguồn (xác minh 2026-10-30)

- Microsoft Store miễn phí đăng ký cho cá nhân: <https://windowsreport.com/you-wont-have-to-pay-a-fee-to-publish-apps-to-microsoft-store/>
- Microsoft giữ 0% với app không phải game dùng commerce riêng: <https://www.tweaktown.com/news/80216/windows-11s-new-100-dev-revenue-share-is-for-apps-only-not-pc-games/index.html>
- Microsoft Store tự ký lại MSIX (Microsoft Learn): <https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/app-package-requirements>
- Google Play 12 tester / 14 ngày: <https://support.google.com/googleplay/android-developer/answer/14151465>, <https://www.choicely.com/blog/google-play-12-tester-rule>
- Google Play phí & external billing tại Mỹ 2026 (nhiều nguồn mâu thuẫn, **cần xác minh**): <https://support.google.com/googleplay/android-developer/answer/15582165>, <https://www.paymentsjournal.com/google-cuts-app-store-fees-opens-up-external-payments/>
- Apple external link (Mỹ): <https://thenextweb.com/news/supreme-court-apple-epic-contempt-stay-denial>
- TWA / Digital Asset Links: <https://web.dev/articles/using-a-pwa-in-your-android-app>
