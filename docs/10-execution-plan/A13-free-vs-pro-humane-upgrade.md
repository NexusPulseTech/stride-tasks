# A13: Free và PRO rõ ràng, mời nâng cấp tử tế, giá theo quốc gia trên trang đích

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | A: First Dollar |
| Ưu tiên | P0 (đang bán thật; quyết định tỉ lệ chuyển đổi Free sang PRO) |
| Ước lượng | 1 ngày |
| Phụ thuộc | A12 |
| Trạng thái | ☑ 2026-11-10 (web d05ee2c, kiểm trên production) |

## Mục tiêu
Người dùng biết ngay gói Free gồm gì và PRO thêm gì, thấy đúng giá cho quốc gia của mình ở cả trang đích lẫn trong app, và chỉ được mời nâng cấp ở thời điểm hợp lý, luôn có lối từ chối không áy náy.

## Vì sao (founder rà ngày 2026-11-10)
1. Trong app, phần Free và PRO nằm rải rác: một danh sách lợi ích, một dòng "gói Free vẫn giữ...", một ô mức sử dụng ở cuối. Người dùng không so sánh được hai gói trong một cái nhìn.
2. Khi chạm giới hạn, app hiện cùng lúc một toast và một khung màu hổ phách "Unlock {feature}" kiểu cảnh báo, giọng giao dịch ("No trial passes left... Upgrade"). Cảm giác bị phạt, không nói điều gì vẫn được giữ.
3. Không có lời mời nào ở thời điểm người dùng đã nhận được giá trị; người dùng chỉ gặp PRO khi bị chặn.
4. Trang đích ghi giá cố định: khách ở Ấn Độ đọc trang tiếng Anh thấy $19 rồi vào app thấy $9.95; khách đọc trang tiếng Việt từ Mỹ thấy $9.95 rồi vào app thấy $19.
5. Bản app HTML cũ (chỉ tiếng Việt) vẫn được tải từ menu, trùng vai trò với PWA và là một bản miễn phí nằm ngoài gói.

## Chuẩn tham chiếu (nghiên cứu 2026-11-10)
- **Mẫu gây hại cần tránh**: báo cáo của FTC (2022, "Bringing Dark Patterns to Light") xếp "nagging" (lặp lời mời tới khi người dùng chịu) vào mẫu gây hại; "confirmshaming" là câu từ chối mang tính bêu xấu (RevenueCat, UX Collective). Ẩn nút đóng cũng là mẫu gây hại.
- **Freemium chính đáng**: nói rõ từ đầu cái gì miễn phí, cái gì trả phí; giới hạn theo dung lượng thay vì làm bản Free kém đi (nguồn tiếng Trung: dodopayments, woshipm; nguồn tiếng Nhật: inblog, Newsweek Japan).
- **Thời điểm**: mời sau khi người dùng đã nhận giá trị, đặt lời mời ngay tại chỗ chạm giới hạn kèm mức dùng ("5/5"), không bật cửa sổ chen ngang; luôn có lựa chọn ẩn vĩnh viễn và giới hạn tần suất (genesysgrowth, RevenueCat).
- **Giá theo sức mua**: ParityDeals, Gumroad hiện giá theo quốc gia ngay trên trang giá. Lách bằng VPN là có thật; founder chọn chấp nhận và chỉ ghi log (A12).
- **Lối cho người khó khăn**: một số nhà phát triển độc lập (Keysmith, InstallBuilder) mời người chưa đủ khả năng chi trả viết thư để được giúp.

## Quyết định
1. Thẻ "Gói" trong hộp PRO hiện 2 thẻ cạnh nhau: **Free** (0 đồng, mãi mãi, "không phải bản dùng thử", kèm mức dùng thật của người dùng) và **PRO** ("mọi thứ của Free, cộng thêm", giá theo quốc gia, nút mua). Thẻ Free có nhãn "Gói hiện tại".
2. Khi chạm giới hạn: một khung màu trung tính nói rõ điều vẫn được giữ và lựa chọn khác (xóa hoặc gộp dự án; xem trước báo cáo và sao chép checklist vẫn miễn phí), có nút "Để sau". Bỏ toast trùng lặp.
3. Báo trước giới hạn, không chặn: ô thêm dự án hiện "còn 1 dự án trong gói Free" khi còn 1, và "gói Free gồm 5 dự án" khi đã đủ, kèm link xem các gói.
4. Lời mời theo khoảnh khắc giá trị: một thẻ cảm ơn khi người dùng đã hoàn thành ít nhất 20 việc thật (không tính dữ liệu ví dụ) trong ít nhất 3 ngày khác nhau. Tối đa 2 lần, cách nhau ít nhất 30 ngày, có nút "Không hiện lại", không hiện khi đang chạy đồng hồ tập trung, không hiện cho PRO.
5. Nói thật vì sao có phí: studio độc lập nhỏ, không quảng cáo, không theo dõi, không nhà đầu tư; tiền PRO trả cho phát triển và máy chủ đồng bộ. Thêm một dòng cho người chưa đủ khả năng chi trả viết thư về support. Founder có thể bỏ dòng này nếu không muốn nhận yêu cầu.
6. Trang đích hỏi cùng máy chủ giá với app (`/v1/pricing`) và thay giá, giá sau 100 bản quyền, nút mua theo quốc gia. Không hỏi được thì giữ giá tĩnh. Bảng giá trong script phải khớp `PRICING_TIERS` (có test).
7. Không đổi giới hạn Free (5 dự án, 3 lần xuất báo cáo Markdown) trong việc này: đo tỉ lệ chuyển đổi trước rồi mới chỉnh.
8. Bỏ hẳn bản app HTML cũ: gỡ khỏi menu, hướng dẫn điện thoại và code; địa chỉ cũ thành trang chuyển hướng về `/vi/` (meta refresh, canonical, noindex) để link cũ không lỗi.

## Phạm vi
- Trong: hộp PRO, thông điệp giới hạn, ô thêm dự án, thẻ cảm ơn, chuỗi dịch EN/VI, trang đích EN/VI, gỡ bản HTML cũ.
- Ngoài: đổi giá hay giới hạn Free, gói thuê bao (D04), tách giá riêng cho Việt Nam so với 131 nước khác (cần sản phẩm Polar mới).

## Các bước
1. Gỡ bản app HTML cũ, thay bằng trang chuyển hướng.
2. Chuỗi dịch EN/VI cho các gói, thông điệp giới hạn, lý do có phí, thẻ cảm ơn; bỏ chuỗi không còn dùng.
3. Hộp PRO: thẻ "Gói" với 2 thẻ Free/PRO; khung giới hạn trung tính có "Để sau".
4. App: bỏ toast trùng khi mở bảng gói; gợi ý ở ô thêm dự án; thẻ cảm ơn với hàm quyết định thuần (có test).
5. Trang đích: script giá theo quốc gia, đánh dấu chỗ hiện giá trong HTML EN/VI; test khớp bảng giá.
6. Kiểm trên trình duyệt (EN, VI, sáng, tối, điện thoại), deploy, kiểm production.
7. Bổ sung sau khi kiểm production (2026-11-10): ảnh chụp app trên trang đích và trong manifest là bản cũ tiếng Việt với dữ liệu mẫu cũ, nên chụp lại từ production: bộ tiếng Anh cho `/en/` và manifest, bộ tiếng Việt trong `public/screenshots/vi/` cho `/vi/`. Manifest PWA (tên, mô tả, lối tắt, nhãn ảnh) chuyển sang tiếng Anh vì thị trường chính là quốc tế. Bỏ nốt chữ "AnkiWeb" ở Tiêu điểm hôm nay và các nhãn trợ năng cố định tiếng Anh.

## Tiêu chí nghiệm thu
- [x] Hộp PRO hiện 2 thẻ Free/PRO; thẻ Free hiện mức dùng thật; đúng ở cả EN/VI, sáng/tối, màn hình điện thoại (kiểm trên dev server 2026-11-10; trên điện thoại thẻ PRO lên trước).
- [x] Chạm giới hạn 5 dự án hoặc hết lượt xuất báo cáo: không còn toast trùng; khung trung tính nói điều được giữ, có "Để sau" (kiểm bằng cách tạo 6 dự án; dòng nhắc ở ô thêm dự án hiện từ dự án thứ 4).
- [x] Thẻ cảm ơn chỉ hiện đúng điều kiện (test `src/hooks/__tests__/upgradeNudge.test.ts`; trên trình duyệt: 21 việc thật trong 3 ngày thì hiện, bấm "Để sau" rồi tải lại thì không hiện).
- [x] Trang đích: khách ở Việt Nam thấy $9.95 ở cả trang EN và VI; khách ở nước thu nhập cao thấy $19; mất mạng thì vẫn thấy giá tĩnh. Production 2026-11-10 từ IP Việt Nam: trang EN hiện "$9.95, Price for Vietnam", sau 100 bản quyền $14.95; phản hồi giả lập: Ấn Độ trên trang EN ra $9.95, Mỹ trên trang VI ra $19. Test `src/config/__tests__/sitePricing.test.ts` giữ giá script, HTML và app khớp nhau.
- [x] Không còn đường tải bản HTML cũ; `/quan-ly-cong-viec.html` chuyển về `/vi/` (kiểm trên production: trang 685 byte có meta refresh về /vi/). Hộp PRO trên production hiện 2 gói và "$9.95, Price for Vietnam".

## Rủi ro & rollback
- Thẻ cảm ơn bị coi là làm phiền: điều kiện chặt và có "Không hiện lại"; tắt nhanh bằng cách nâng ngưỡng hoặc bỏ thẻ khỏi `App.tsx`.
- Dòng "chưa đủ khả năng chi trả" có thể kéo yêu cầu xin miễn phí: theo dõi hộp thư support; bỏ dòng nếu quá tải.
- Script trang đích lỗi: giá tĩnh vẫn hiện, không chặn mua. Rollback bằng revert.

## Tham chiếu
- FTC, Bringing Dark Patterns to Light (2022)
- RevenueCat, Is monetization hurting your app's user experience
- genesysgrowth, Designing in-app upgrade prompts
- ParityDeals, Gumroad: Purchasing Power Parity
- Keysmith pricing (lối cho người chưa đủ khả năng chi trả)
- A12: `A12-commercial-ui-and-regional-pricing.md`
