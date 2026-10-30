# Bài đăng cộng đồng dán sẵn

> **Thuộc**: 02-growth/marketing-kit · **Trạng thái**: Ready · **Cập nhật**: 2026-10-30
> **Trước khi đăng ở bất kỳ nhóm/subreddit nào**: đọc luật của nơi đó. Nhiều nơi cấm link hoặc chỉ cho tự giới thiệu trong thread riêng. Viết như người chia sẻ kinh nghiệm, sản phẩm là phần phụ. Trả lời mọi bình luận trong ngày.

## 1. Facebook group (tiếng Việt)

### Bài A: chia sẻ phương pháp (nhóm tự học, ôn thi, IELTS)
```
Mình từng học xong 3 ngày là quên gần hết. Sau khi tìm hiểu, mình đổi cách ôn sang "lặp lại ngắt quãng": ôn lại đúng lúc sắp quên, khoảng cách giữa các lần ôn xa dần (1 ngày, 3 ngày, 1 tuần...).

Cách mình làm:
1. Mỗi chủ đề là một việc (VD: "Ôn từ vựng Unit 5").
2. Học xong thì hẹn lần ôn đầu sau 1 ngày.
3. Đến lịch, tự hỏi mình nhớ bao nhiêu: quên nhiều thì ôn lại sớm, nhớ tốt thì giãn ra.
4. Mỗi phiên học bấm Pomodoro 25 phút để không bị xao nhãng.

Mình là dev nên tự làm một app miễn phí để làm việc này tự động (không cần tài khoản, chạy offline). Ai cần thì mình để link ở bình luận. Các bạn đang ôn kiểu gì, chia sẻ với mình nhé.
```
*(Link đặt ở bình luận nếu nhóm cho phép: `https://tasks.nexuspulsetech.xyz/vi/?utm_source=facebook&utm_medium=community&utm_campaign=group-study`)*

### Bài B: xin góp ý (nhóm IT, lập trình, startup)
```
Mình vừa làm xong một app quản lý công việc chạy offline: nhập việc 1 dòng, Pomodoro, nhắc ôn lại theo SM-2, đồng bộ mã hóa đầu-cuối trên Cloudflare (máy chủ chỉ giữ bản mã). Làm một mình, chi phí hạ tầng hiện là 0đ.

Mình cần 10 người dùng thật góp ý thẳng: chỗ nào khó hiểu, chỗ nào thừa. Ai rảnh dùng thử 3 ngày giúp mình nhé. Link ở bình luận. Cảm ơn mọi người!
```

## 2. Reddit (tiếng Anh)

### r/SideProject
**Title**: `I built an offline-first task manager with Pomodoro and spaced repetition for tasks`
```
Hi all, solo dev from Vietnam here.

Stride is a task manager for people who study or do deep work:
- one-line capture: "Review chapter 3 ~45m @daily !pin"
- Pomodoro with a deep-work log next to your tasks
- spaced-repetition reviews (SM-2) for tasks and topics, not just flashcards
- no account, works offline; optional end-to-end encrypted sync (server only stores ciphertext)

Stack: React + Vite PWA, Cloudflare Workers + D1. Free to use. I'd love honest feedback on onboarding and on whether the SM-2 reviews make sense to you.

Link in the comments.
```

### r/productivity (chỉ trong thread tự giới thiệu hằng tuần nếu subreddit có)
```
Built Stride: an offline task manager that combines one-line capture, Pomodoro and spaced-repetition reviews for tasks. No account needed. Looking for feedback from people who juggle study and work. [link]
```

### r/GetStudying (chỉ khi luật cho phép, nội dung là mẹo học)
**Title**: `What finally fixed my "study then forget" problem: spaced reviews for topics, not just flashcards`
Nội dung: chia sẻ phương pháp như Bài A tiếng Việt; chỉ nhắc app ở cuối nếu luật cho phép.

## 3. Show HN

**Title**: `Show HN: Stride, an offline-first task manager with E2E sync and spaced repetition`

**Bình luận đầu tiên của bạn**
```
Hi HN, I'm the solo developer behind Stride.

Why: I used three tools for one study session (Anki, a notes app, a timer). Stride puts planning, focus (Pomodoro) and spaced-repetition reviews (SM-2) for tasks in one offline app.

How it works:
- Local-first: data lives in localStorage/IndexedDB, no account.
- Optional sync: a random 128-bit code (never leaves the device) derives an AES-256-GCM key via HKDF. The server (Cloudflare Workers + D1) stores only ciphertext and a hashed vault ID.
- Writes use optimistic concurrency (expected version, 409 on conflict), merge is per-entity last-writer-wins with tombstones.
- Licenses are Ed25519-signed tokens verified offline.

Limitations: no native mobile apps yet (it's a PWA), reminders when the app is closed are limited by the web platform, and conflict resolution is last-writer-wins.

The code is open source. I'd really like feedback on the sync design and on the first-run experience.
```

## 4. Indie Hackers

**Title**: `Launching a privacy-first task app from Vietnam with $0 infrastructure`
Nội dung: vì sao làm, quyết định giá (PPP, mua một lần), số liệu thật tuần đầu (visitor, người dùng, đơn), điều học được. Cập nhật lại sau mỗi mốc.

## 5. Viblo / dev.to (bài kỹ thuật)

**Tiêu đề**: "Đồng bộ mã hóa đầu-cuối cho app offline trên Cloudflare Workers miễn phí"
**Dàn ý**: (1) bài toán local-first và đồng bộ; (2) sinh mã đồng bộ, vaultId, HKDF, AES-GCM; (3) CAS theo version và xử lý 409; (4) hợp nhất LWW + tombstone; (5) kiểm thử trên production; (6) chi phí. Cuối bài: link repo và app.

## 6. Spiderum (bài dài, giọng kể chuyện)

**Tiêu đề**: "Mình đã ôn thi bằng lặp lại ngắt quãng như thế nào"
**Dàn ý**: trải nghiệm học xong là quên → tìm hiểu đường cong quên lãng → cách ôn ngắt quãng cho từng chủ đề → kết hợp Pomodoro → công cụ mình dùng (nhắc tới Stride một lần ở cuối).

## 7. Telegram: thông báo mở bán (dùng khi PRO mở bán)

```
🎉 Stride PRO đã mở bán!

Giá Thành viên sáng lập cho 100 suất đầu:
• Việt Nam: 149.000₫ (sau đó 199.000₫)
• Quốc tế: $19 (sau đó $29), thị trường mới nổi $9.95

PRO trọn đời gồm đồng bộ mã hóa giữa các thiết bị, không giới hạn dự án, báo cáo Markdown không giới hạn và mọi bản cập nhật.
Hoàn tiền 14 ngày, không cần lý do.

Mua tại: https://tasks.nexuspulsetech.xyz/vi/?utm_source=telegram&utm_medium=social&utm_campaign=founding-launch
Còn lại: [số suất thật] suất
```
