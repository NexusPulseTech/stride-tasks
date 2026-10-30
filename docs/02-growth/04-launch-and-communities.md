# Launch & cộng đồng

> **Thuộc**: 02-growth · **Trạng thái**: Draft v1 · **Cập nhật**: 2026-10-30
> **Mục đích**: ra mắt đúng luật từng nền tảng, mang về người dùng sớm và phản hồi thật — không spam.

## 1. Bộ tài sản launch (chuẩn bị một lần, dùng mọi nơi)

- [ ] Câu một dòng EN/VI (xem [02-site-architecture-and-landing-pages.md](./02-site-architecture-and-landing-pages.md) mục 4)
- [ ] Logo 240×240, ảnh chụp màn hình (đã có trong `public/screenshots/`), GIF/video demo 45–60 giây
- [ ] 3 lợi ích chính + câu chuyện founder (vì sao làm Stride)
- [ ] FAQ 5 câu (dữ liệu, offline, giá, hoàn tiền, nền tảng)
- [ ] Mã ưu đãi Founding Member + trang giá hoạt động

## 2. Theo từng nền tảng

| Nền tảng | Luật/văn hóa cần tôn trọng | Cách làm |
| :--- | :--- | :--- |
| **Show HN** | Phải là thứ bạn làm ra và người khác **dùng thử được ngay**; không ép đăng ký (Stride không cần tài khoản — lợi thế); founder phải có mặt trả lời | Tiêu đề: `Show HN: Stride – offline-first task manager with E2E sync and spaced repetition`; bình luận đầu kể vấn đề, kiến trúc, giới hạn; đăng thứ Ba–Năm sáng giờ Mỹ |
| **Product Hunt** | Không xin upvote trực tiếp; tương tác cộng đồng nhiều tuần trước; ngày tốt nhất là ngày *bạn chuẩn bị kỹ nhất* | Tạo hồ sơ maker sớm, ủng hộ launch của người khác, ra mắt 00:01 giờ Thái Bình Dương (thứ Ba–Năm), bình luận maker dạng câu chuyện, trả lời mọi bình luận nhanh, chuẩn bị nội dung tuần sau launch |
| **Reddit** | Mỗi subreddit có luật tự giới thiệu riêng; nhiều nơi chỉ cho phép trong thread hằng tuần; tham gia đóng góp trước khi quảng bá | r/SideProject (cho phép giới thiệu), thread self-promo của r/productivity, r/GetStudying/r/studytips khi bài mang giá trị học tập thật; viết như người dùng chia sẻ cách học, sản phẩm là phần phụ |
| **Indie Hackers** | Cộng đồng founder, thích số liệu minh bạch | Bài "How I launched…" kèm số thật (visitor, đơn) |
| **AlternativeTo** | Thư mục, người dùng tự đề xuất thay thế | Tạo trang sản phẩm, gắn "alternative to" Todoist, TickTick, Focus To-Do, Microsoft To Do |
| **SaaSHub / thư mục khác** | Thư mục | Đăng sau khi có trang đích EN |
| **Facebook group (VN)** | Luật từng nhóm, nhiều nhóm cấm link | Bài chia sẻ phương pháp học (Pomodoro + ôn ngắt quãng), link để ở bình luận nếu luật cho phép |
| **Spiderum** | Bài dài có chiều sâu | Câu chuyện "Mình đã ôn thi bằng lặp lại ngắt quãng thế nào" |
| **Viblo / dev.to** | Cộng đồng kỹ thuật | Bài kỹ thuật: E2E sync trên Cloudflare free tier, LWW + tombstone |
| **Voz / Tinhte** | Diễn đàn công nghệ | Chủ đề giới thiệu app Việt, sẵn sàng nhận phê bình |

## 3. Thứ tự đề xuất

1. Tuần 1–2 (playbook 14 ngày): người quen → Facebook group → Viblo/Spiderum → AlternativeTo → Reddit → **Show HN**.
2. Tuần 3–6: tích lũy 5–10 khách + testimonial, sửa onboarding.
3. Tuần 6–8: **Product Hunt** (task `C04`) khi đã có bằng chứng xã hội & trang đích hoàn chỉnh.

## 4. Ngày launch — checklist

- [ ] Trang đích, trang giá, thanh toán đã kiểm thử lại trong 24h trước
- [ ] Worker không gần giới hạn free tier (xem dashboard Cloudflare)
- [ ] Tắt deploy lớn trong ngày launch (chỉ hotfix)
- [ ] Mẫu trả lời FAQ sẵn sàng
- [ ] Theo dõi phễu mỗi 2–3 giờ

## 5. Sau launch

- Bài tổng kết số liệu (Indie Hackers/blog) trong 7 ngày.
- Gửi email/tin nhắn cảm ơn người dùng mới, mời phỏng vấn.
- Đưa câu hỏi lặp lại vào FAQ và tài liệu.

## Nguồn

- Hướng dẫn launch Product Hunt 2026 (tổng hợp, **nguồn thứ ba**): <https://blog.innmind.com/how-to-launch-on-product-hunt-in-2026>, <https://www.producthunt.com/p/undefined/how-would-i-approach-product-hunt-in-2026>
- Show HN guidelines: <https://news.ycombinator.com/showhn.html>
