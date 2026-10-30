# Playbook: khách hàng trả tiền đầu tiên trong 14 ngày

> **Thuộc**: 01-business · **Trạng thái**: Draft v1 · **Cập nhật**: 2026-10-30
> **Mục tiêu**: **1 khách trả tiền** trong ≤ 14 ngày kể từ khi cổng thanh toán chạy; **10 khách** trong 30 ngày.
> **Nguyên tắc**: *"Làm những việc không scale"* — founder tự bán, tự nói chuyện với từng người. Chưa chạy quảng cáo, chưa xây tính năng mới.

## 0. Điều kiện "sẵn sàng bán" (Definition of Ready to Sell)

Không bắt đầu outreach khi còn thiếu một trong các mục sau — mỗi mục là một task trong [../10-execution-plan/](../10-execution-plan/README.md):

- [ ] Thương hiệu & SEO metadata nhất quán "Stride Tasks" (task `A01`)
- [ ] Có Điều khoản + Chính sách hoàn tiền 14 ngày (task `A02`)
- [ ] Thu tiền được: VietQR (SePay) + ít nhất một MoR quốc tế (tasks `A03`–`A05`)
- [ ] Mua thử **thật** bằng thẻ/chuyển khoản của chính mình → kích hoạt PRO → hoàn tiền thành công
- [ ] Trang đích EN + VI có giá, ảnh chụp, FAQ (task `A06`)
- [ ] Đo được lượt truy cập trang đích & trang giá (task `A07`)

## 1. Lịch 14 ngày

| Ngày | Việc | Kết quả mong đợi |
| :--- | :--- | :--- |
| D0–D2 | Hoàn tất điều kiện mục 0 | Mua thử thành công 2 kênh |
| D3 | Quay video demo 45–60 giây (nhập nhanh → Pomodoro → lịch ôn SM-2 → bật đồng bộ); chụp GIF | Tài sản dùng cho mọi bài đăng |
| D4 | Lập danh sách **30 người quen** thuộc phân khúc A/B/C (bạn học, đồng nghiệp, nhóm học) | Bảng theo dõi outreach |
| D5 | Nhắn riêng từng người (mẫu mục 2) — xin **góp ý**, không ép mua | ≥ 10 người dùng thử |
| D6 | Đăng 1 bài giá trị trong 2–3 nhóm Facebook tự học/năng suất (đúng luật nhóm) | ≥ 50 lượt vào trang đích |
| D7 | Bài viết Spiderum hoặc Viblo: câu chuyện kỹ thuật/ôn thi có nhắc sản phẩm | Lưu lượng dài hạn + backlink |
| D7–D8 | Đăng AlternativeTo (alternative to Todoist, TickTick, Focus To-Do) + Indie Hackers | Hiện diện quốc tế |
| D8 | Reddit: r/SideProject; thread tự giới thiệu hằng tuần của r/productivity; r/GetStudying nếu luật cho phép — **đọc luật từng subreddit trước** | ≥ 10 người dùng quốc tế |
| D9 | **Show HN** (thứ Ba–thứ Năm, sáng giờ Mỹ): *"Show HN: Stride – offline-first task manager with E2E sync and spaced repetition"* | Phản hồi kỹ thuật, người dùng nhóm B |
| D9 | Bắt đầu hồ sơ Microsoft Store (task `C05`) | Kênh thứ hai |
| D10–D12 | Trả lời **mọi** góp ý trong ≤ 24h; sửa lỗi onboarding nhỏ; gửi ưu đãi Founding cho người đã dùng ≥ 3 ngày | Khách trả tiền đầu tiên |
| D13–D14 | Phỏng vấn khách đầu tiên (mục 5); xin testimonial; tổng kết số liệu | Bài học + bằng chứng xã hội |

## 2. Mẫu tin nhắn

**Tiếng Việt (người quen):**
> Chào [tên], mình vừa làm xong Stride Tasks — app quản lý việc chạy offline, có Pomodoro và nhắc ôn lại theo kiểu Anki nhưng cho công việc/chủ đề. Mình đang cần 10 người dùng thật góp ý thẳng. Bạn dùng thử 3 ngày giúp mình được không? Link: [url]. Nếu thấy hợp, 100 người đầu được giá Founding giảm 30%.

**English (cộng đồng):**
> I built Stride, an offline-first task manager for learners: plan in one line, focus with Pomodoro, and get **spaced-repetition reviews for tasks/topics** (SM-2). No account, data stays on your device, optional end-to-end encrypted sync. I'd love blunt feedback from people who study for exams. [url]

**Bình luận đầu tiên cho Show HN**: vấn đề cá nhân dẫn tới sản phẩm → kiến trúc (local-first, AES-256-GCM, Cloudflare Worker + D1 chỉ giữ bản mã, LWW + tombstone) → điều chưa làm được → câu hỏi mở cho cộng đồng.

## 3. Xử lý phản đối

| Phản đối | Trả lời |
| :--- | :--- |
| "Có app miễn phí rồi" | Bản Free dùng mãi mãi; PRO chỉ cần khi bạn muốn đồng bộ & nhiều dự án. Rẻ hơn 1 năm TickTick. |
| "Lỡ app ngừng hoạt động?" | Dữ liệu nằm trên máy bạn, xuất JSON bất kỳ lúc nào; app chạy offline không phụ thuộc máy chủ. |
| "Dữ liệu có an toàn?" | Mã hóa trên thiết bị, máy chủ chỉ thấy bản mã; mã nguồn công khai để kiểm chứng. |
| "Không chắc có hợp không" | Hoàn tiền 14 ngày, không cần lý do. |

## 4. Chỉ số theo dõi hằng ngày

Lượt vào trang đích → lượt mở app → người tạo ≥ 3 việc → người quay lại ngày thứ 2 → lượt mở trang giá → lượt bấm thanh toán → đơn thành công. Định nghĩa chi tiết: [08-kpis-and-unit-economics.md](./08-kpis-and-unit-economics.md).

## 5. Sau khách trả tiền đầu tiên

1. Gửi lời cảm ơn cá nhân trong 1 giờ.
2. Phỏng vấn 15 phút: *Vì sao bạn mua? Suýt nữa không mua vì điều gì? Bạn sẽ giới thiệu cho ai?*
3. Xin phép dùng câu nói làm testimonial trên trang đích.
4. Ghi lại nguồn khách (kênh nào) → dồn sức vào kênh đó.

## 6. Không làm

- Không quảng cáo trả phí khi chưa biết tỉ lệ chuyển đổi.
- Không spam nhóm/subreddit, không tự tạo review giả, không khan hiếm giả.
- Không thêm tính năng mới trước khi nói chuyện với ít nhất 10 người dùng.

## Nguồn tham khảo

- Paul Graham, *Do Things that Don't Scale*: <http://paulgraham.com/ds.html>
- Kinh nghiệm launch Product Hunt 2026 (tổng hợp, **nguồn thứ ba**): <https://blog.innmind.com/how-to-launch-on-product-hunt-in-2026>
- Ví dụ indie bán được từ Reddit/ưu đãi mở bán: <https://dev.to/abuvanth/my-first-sales-after-launching-an-offline-ai-translator-2mea>
