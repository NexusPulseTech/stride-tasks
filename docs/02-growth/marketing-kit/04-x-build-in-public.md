# X: build in public (tiếng Anh)

> **Thuộc**: 02-growth/marketing-kit · **Trạng thái**: Ready · **Cập nhật**: 2026-10-30
> **Quy tắc**: 1 bài/ngày. Nội dung giá trị nằm trong bài; **link đặt ở trả lời đầu tiên** (X nói không còn phạt link, nhưng số liệu độc lập còn mâu thuẫn, nên đây là cách ít rủi ro nhất). Trả lời mọi bình luận. Chia sẻ số liệu thật.

## 15 bài đăng

1. **Intro**: "I'm building Stride, a task manager for people who study. Plan in one line, focus with Pomodoro, and get spaced-repetition reviews (SM-2) for your tasks. No account, works offline. Building it in public from Vietnam. Day 1 👋"
2. **Problem**: "I used Anki for flashcards, Notion for plans and a separate timer app. Three apps for one study session. Stride puts all three in one place."
3. **Tech**: "Stride's sync is end-to-end encrypted. Your device encrypts everything with AES-256-GCM before upload. My server stores ciphertext only. I literally can't read your tasks."
4. **Cost**: "Backend for my task app: Cloudflare Workers + D1 + KV. Monthly bill so far: $0. My estimate: the free tier covers about 600 daily sync users with the current polling. Will share real numbers when that changes."
5. **Feature**: "Typing `Review chapter 3 ~45m @daily !pin` creates a 45-minute daily task, pinned to the top. One line instead of five clicks."
6. **Decision**: "No account, on purpose. Your data lives on your device. Sync is optional and uses a random 26-character code instead of an email."
7. **Pricing**: "Pricing decision: free forever for one device. PRO is a one-time purchase with regional pricing. I'd rather have many happy users paying a fair price once than a few paying monthly."
8. **Lesson**: "Mistake I almost shipped: my app polled the license server every 6 seconds for up to 72 hours. A few open tabs would have burned my whole free quota. Adding backoff before payments go live. Measure your polling!" *(chỉ đăng sau khi task A04 xong; khi đó đổi thành "Fixed with backoff")*
9. **Design**: "Ran Lighthouse on Stride's landing page: 100 accessibility, 100 SEO, 100 best practices. Biggest fix was a red badge with 3.77:1 contrast. WCAG wants 4.5:1."
10. **Question**: "Students and self-learners: how do you decide what to review today? Genuinely curious, it shapes what I build next."
11. **Behind the scenes**: "Spaced repetition for tasks works like this in Stride: when a review is due you pick how it went, and the next review moves further out. Simple, but it's the part people love most."
12. **Metrics** (khi có số thật): "Week 1 numbers: X visitors, Y people created 3+ tasks, Z joined the founding list. Small, but real."
13. **Open source**: "Stride's code is public on GitHub. If you care about privacy, you shouldn't have to trust me. You can read the sync code yourself."
14. **Founding** (khi mở bán): "Founding offer is live: Lifetime PRO for $19 for the first 100 licenses, then $29. 14-day refund, no questions. Thank you to everyone who tested early."
15. **Thank you**: "First paying customer today. Someone I've never met decided Stride was worth paying for. I'm not going to pretend that doesn't feel amazing."

## Thread 1: "How I built end-to-end encrypted sync on Cloudflare's free tier"

1. Hook: "I built end-to-end encrypted sync for my task app on Cloudflare's free tier. Here's the whole design in 7 posts 🧵"
2. The sync code: 128-bit random, Crockford Base32, 26 characters. It never leaves the device.
3. Vault ID = SHA-256 of a prefix + the code, so the server can't reverse it.
4. Keys via HKDF-SHA256, data gzipped then encrypted with AES-256-GCM, vault ID as associated data.
5. Writes use optimistic concurrency: PUT with the expected version, 409 means another device wrote first, so pull, merge, retry.
6. Merge is last-writer-wins per task with tombstones (90-day TTL) so deleted items don't come back.
7. Result: the server only stores ciphertext. Tested end to end on production. Code is open source (link in reply).

## Thread 2: "Why my task app has no account"

1. "My task app has no sign-up screen. Here's why that was a business decision, not just a privacy one 🧵"
2. Zero friction: people try it in 5 seconds.
3. No password resets, no account database to leak.
4. Server costs stay near zero because data lives on devices.
5. The trade-off: if you clear your browser data without a backup, it's gone. So Stride nags you to back up and offers encrypted sync.
6. "Would you use a task app without an account? Why or why not?"

## Khi nào đăng

Đăng vào khung giờ khán giả quốc tế hoạt động (sáng giờ Mỹ = tối giờ Việt Nam). Sau 2 tuần, xem số liệu trong X Analytics để chọn giờ tốt nhất của chính tài khoản bạn.
