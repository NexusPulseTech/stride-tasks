# Playbook hỗ trợ khách hàng

> **Thuộc**: 09-operations · **Trạng thái**: Draft v1 · **Cập nhật**: 2026-10-30
> Giai đoạn đầu, hỗ trợ tốt là **kênh bán hàng**: mỗi câu trả lời nhanh, tử tế là một testimonial tiềm năng.

## 1. Kênh & cam kết

| Kênh | Cam kết phản hồi |
| :--- | :--- |
| Email hỗ trợ (`VITE_SUPPORT_EMAIL`, mặc định `support@nexuspulsetech.xyz`) | ≤ 24 giờ (≤ 4 giờ trong tuần launch) |
| Bình luận trên bài launch (Reddit/HN/PH/Facebook) | Trong ngày |
| GitHub Issues (lỗi kỹ thuật) | ≤ 3 ngày |

Ghi mọi yêu cầu vào một bảng (ngày, kênh, loại, trạng thái, nội dung tóm tắt) để thấy vấn đề lặp lại.

## 2. Mẫu trả lời

**Đã thanh toán nhưng chưa thấy PRO (VI)**
> Chào bạn, cảm ơn bạn đã ủng hộ Stride! Bạn gửi giúp mình thời gian chuyển khoản, số tiền và nội dung (có mã bắt đầu bằng STR) nhé. Mình sẽ kiểm tra và gửi link kích hoạt trong hôm nay.

**Payment done but PRO not active (EN)**
> Thanks for supporting Stride! Could you reply with the email you used at checkout (or your order number)? I'll send your activation link today.

**Yêu cầu hoàn tiền (VI)**
> Không vấn đề gì, Stride hoàn tiền trong 14 ngày không cần lý do. Mình đã xử lý hoàn tiền, tiền sẽ về theo thời gian của ngân hàng/cổng thanh toán. Nếu bạn có thể chia sẻ điều gì chưa ổn, mình rất cảm ơn để cải thiện.

**Lỗi đồng bộ (EN)**
> Sorry about that. Your data is still safe on each device. Could you tell me which devices/browsers you use and the exact message you see? Please don't send your sync code, I never need it.

**Đề xuất tính năng (VI)**
> Cảm ơn bạn, ý tưởng rất hay. Mình đã ghi lại; khi có thêm người cùng cần, mình sẽ ưu tiên làm và báo bạn.

## 3. Quy tắc

- Không bao giờ yêu cầu khách gửi **mã đồng bộ**, mật khẩu, hay dữ liệu công việc.
- Không dùng email cá nhân của founder cho hỗ trợ; dùng địa chỉ hỗ trợ của sản phẩm.
- Lỗi phát hiện qua hỗ trợ → tạo issue/task kèm cách tái hiện; báo lại khách khi sửa xong.
- Câu hỏi lặp lại ≥ 3 lần → thêm vào FAQ trang đích và tài liệu người dùng.

## 4. Thư của khách tới support@ rơi vào thư rác (kiểm 2026-11-10)

Đường đi: khách gửi tới `support@nexuspulsetech.xyz` → Cloudflare Email Routing chuyển tiếp → hộp Gmail của founder. DNS hiện có MX Cloudflare, SPF `include:_spf.mx.cloudflare.net` và DKIM `cf2024-1`, nhưng **chưa có bản ghi DMARC**. Thư chuyển tiếp hay bị Gmail nghi ngờ (SPF của người gửi gốc không còn khớp sau khi chuyển tiếp; tên miền .xyz còn mới, uy tín thấp), và từ 2025-07 Cloudflare chỉ coi là tin cậy thư gốc đạt SPF hoặc DKIM.

Đã làm ngày 2026-11-10 (founder duyệt): bộ lọc Gmail "Stride Support" (bước 1) và DMARC Management với `p=none` (bước 2, đã kiểm bản ghi `_dmarc` trên DNS). Báo cáo DMARC đầu tiên về sau khoảng 24 giờ, xem ở Cloudflare, Email, DMARC Management.

Cách xử lý, theo thứ tự:
1. Trong Gmail, mở thư bị vào thư rác, bấm "Không phải thư rác". Sau đó tạo bộ lọc: Đến `support@nexuspulsetech.xyz` → "Không bao giờ gửi vào Thư rác" (thêm nhãn "Stride Support" cho dễ tìm). Đây là cách chắc chắn nhất với thư chuyển tiếp.
2. Cloudflare, Email, DMARC Management: bật để Cloudflare tạo bản ghi `_dmarc` với chính sách `p=none` (chỉ theo dõi, không chặn thư) và địa chỉ nhận báo cáo. Không đặt `quarantine` hay `reject` khi chưa có dịch vụ gửi thư đã ký DKIM cho tên miền, vì sẽ làm hỏng thư trả lời.
3. Muốn trả lời khách bằng địa chỉ `support@` mà không bị gắn cờ: dùng dịch vụ gửi thư có DKIM cho tên miền (Resend đã có trong code Worker, cần xác minh tên miền và thêm bản ghi DKIM của Resend), hoặc hộp thư theo tên miền (Zoho Mail, Google Workspace). Gmail "Gửi thư dưới dạng" qua SMTP của Gmail không ký DKIM cho tên miền này.
4. Khi một thư vẫn vào thư rác: mở "Hiển thị bản gốc" trong Gmail, xem dòng SPF, DKIM, DMARC để biết thư gốc của khách đạt hay trượt.
