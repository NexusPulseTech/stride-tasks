# Playbook: khách hàng trả tiền đầu tiên (quốc tế là chính)

> **Thuộc**: 01-business · **Trạng thái**: v2 (đổi sang quốc tế theo ADR-0009) · **Cập nhật**: 2026-10-30
> **Mục tiêu**: **1 khách quốc tế trả tiền** trong ≤ 14 ngày kể từ khi Polar cho phép thanh toán; **10 khách** trong 30 ngày.
> **Nguyên tắc**: *"Làm những việc không scale"* (Paul Graham): founder tự nói chuyện với từng người, trả lời từng bình luận. Chưa chạy quảng cáo, chưa xây tính năng mới trước khi nói chuyện với 10 người dùng.

## 0. Điều kiện "sẵn sàng bán"

| Điều kiện | Trạng thái 2026-10-30 |
| :--- | :--- |
| Thương hiệu & SEO metadata nhất quán (A01) | ✅ |
| Điều khoản, hoàn tiền 14 ngày, quyền riêng tư (A02) | ✅ |
| Trang đích EN/VI có giá và FAQ (A06) | ✅ (Lighthouse 100/100/100) |
| Đo lượt truy cập (A07) | ✅ Web Analytics; Search Console đã gửi sitemap |
| Claim an toàn, chống cạn hạn mức, thu hồi khi hoàn tiền (A04a) | ✅ |
| **Polar duyệt tài khoản + tích hợp webhook (A03, A04b)** | ⏳ chờ founder đăng ký Polar |
| VietQR (kênh phụ, A05) | ⏳ chờ founder đăng ký SePay |
| Mua thật bằng thẻ của chính mình → PRO → hoàn tiền thành công | ⏳ sau A03-A05 |

**Trong lúc chờ Polar (tối đa 14 ngày)**: xây hiện diện, thu người dùng miễn phí và danh sách chờ. Đây là giai đoạn 1 bên dưới.

## 1. Giai đoạn 1: trước khi mở bán (ngày 1-14)

| Ngày | Việc (quốc tế) | Vì sao |
| :---: | :--- | :--- |
| 1 | Tạo X, Reddit, Product Hunt, Indie Hackers, Hacker News bằng tên thật; đăng bài X đầu tiên ([../02-growth/marketing-kit/04-x-build-in-public.md](../02-growth/marketing-kit/04-x-build-in-public.md) bài 1) | Tài khoản mới không có uy tín; bắt đầu sớm để có lịch sử trước ngày launch |
| 1-14 | Mỗi ngày bình luận hữu ích 2-3 bài ở r/productivity, r/GetStudying, r/Anki, r/selfhosted, Indie Hackers (không quảng cáo) | Cộng đồng tin người đã đóng góp; nhiều subreddit giới hạn tài khoản mới |
| 2 | Đăng AlternativeTo (alternative to Todoist, TickTick, Microsoft To Do, Super Productivity) và SaaSHub | Có backlink và người tìm "alternative" có ý định chọn app mới |
| 3-4 | Quay 2 video tiếng Anh E1, E3 ([../02-growth/marketing-kit/03-short-video-scripts.md](../02-growth/marketing-kit/03-short-video-scripts.md)), đăng TikTok, YouTube Shorts, X | Tài sản dùng cho mọi kênh và Product Hunt |
| 5 | Bài r/SideProject ([../02-growth/marketing-kit/05-community-posts.md](../02-growth/marketing-kit/05-community-posts.md)) | Subreddit cho phép tự giới thiệu, phản hồi thẳng thắn |
| 6-7 | Viết bài kỹ thuật "E2E encrypted sync on Cloudflare's free tier" trên site/dev.to | Chuẩn bị cho Show HN; backlink chất lượng |
| 8 | **Show HN** (thứ Ba-Năm, sáng giờ Mỹ). Ở cạnh máy cả buổi để trả lời | Kênh mang người dùng kỹ thuật (phân khúc B) nhiều nhất trong một ngày |
| 9-10 | Gửi 5 thư xin vào bài "best offline to-do apps" ([../02-growth/08-seo-status-and-plan.md](../02-growth/08-seo-status-and-plan.md) mục 5) | Backlink lâu dài, nguồn mà AI search hay trích dẫn |
| 11-14 | Trả lời mọi góp ý trong 24 giờ, sửa lỗi onboarding nhỏ, mời người dùng thật phỏng vấn 15 phút | Tìm lý do họ sẽ trả tiền (hoặc không) |

**Kênh phụ tiếng Việt** (30% thời gian trở xuống): nhắn người quen, 1-2 bài nhóm Facebook, Viblo. Mục đích là có góp ý nhanh bằng tiếng mẹ đẻ, không phải doanh thu chính.

## 2. Giai đoạn 2: mở bán (khi Polar duyệt xong)

1. Mua thử bằng thẻ của chính mình → PRO kích hoạt → hoàn tiền thành công.
2. Thông báo trên X (bài 14), Indie Hackers, email cho người đã liên hệ; nhắn riêng người dùng đã dùng 3 ngày trở lên.
3. Cập nhật số suất sáng lập còn lại mỗi ngày (số thật).
4. Product Hunt (task C04) khi đã có 5-10 khách và testimonial.

## 3. Mẫu tin nhắn

**Tin nhắn riêng cho người đã bình luận/đánh giá app tương tự (EN)**
> Hi [name], I saw your comment about [their pain, e.g. wanting a todo app without an account]. I built Stride for exactly that: offline, no sign-up, Pomodoro and spaced-repetition reviews for tasks. Would you try it for 3 days and tell me what's missing? No pressure at all. [link]

**Tin nhắn cho người quen (VI)**: xem phiên bản cũ trong lịch sử git hoặc [../02-growth/marketing-kit/05-community-posts.md](../02-growth/marketing-kit/05-community-posts.md) mục 1.

## 4. Xử lý phản đối (EN)

| Objection | Answer |
| :--- | :--- |
| "There are free apps already" | The free version is free forever. PRO is for sync and unlimited projects, and it's a one-time price lower than one year of most subscriptions. |
| "What if you stop working on it?" | Your data stays on your device and exports to JSON anytime. The app runs offline without our server. The code is open source. |
| "Is my data safe?" | Everything is encrypted on your device before sync. Our server only stores ciphertext. You can read the code. |
| "Not sure it fits me" | 14-day refund, no questions asked. |

## 5. Chỉ số theo dõi hằng ngày

Lượt vào `/en/` theo nguồn → lượt mở app → người tạo 3 việc trở lên → người quay lại ngày 2 → lượt xem bảng giá → lượt bấm mua → đơn thành công. Định nghĩa: [08-kpis-and-unit-economics.md](./08-kpis-and-unit-economics.md).

## 6. Không làm

- Không quảng cáo trả phí khi chưa có tỉ lệ chuyển đổi.
- Không spam subreddit/nhóm, không review giả, không khan hiếm giả, không mua upvote.
- Không xây tính năng mới trước khi nói chuyện với 10 người dùng.

## Nguồn

- Paul Graham, *Do Things that Don't Scale*: <http://paulgraham.com/ds.html>
- Show HN guidelines: <https://news.ycombinator.com/showhn.html>
- Polar account reviews (duyệt trước lần rút tiền đầu, tối đa 14 ngày): <https://polar.sh/docs/merchant-of-record/account-reviews>
