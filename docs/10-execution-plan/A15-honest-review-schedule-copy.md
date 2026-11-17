# A15: Mô tả lịch ôn đúng như code (bỏ chữ "SM-2" ở mọi chỗ khách nhìn thấy)

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | A: First Dollar |
| Ưu tiên | P0 (đang đi bán; Show HN khoảng 2026-12-08) |
| Ước lượng | 1 giờ |
| Phụ thuộc | A14 |
| Trạng thái | ◐ 2026-11-18 |

## Mục tiêu
Mọi câu khách đọc về lịch ôn (trang đích, vỏ app, bảng so sánh trong app, llms.txt, trang quyền riêng tư, bản giới thiệu cho Microsoft Store) nói đúng điều code đang làm, không gọi là SM-2 hay "thuật toán của Anki".

## Vì sao
- Code (`src/features/tasks/utils/spacedSnooze.ts`): thang cố định 1, 3, 7, 16, 35 ngày rồi mỗi bậc nhân 2,2, tối đa 365 ngày, chung cho mọi việc; 3 nút: nhắc ngay (về bậc 1), Good (lên 1 bậc), Easy (lên 2 bậc).
- SM-2 (SuperMemo, https://super-memory.com/english/ol/sm2.htm): I(1)=1, I(2)=6, I(n)=I(n-1)×EF, với EF riêng cho từng mục, bắt đầu 2,5, đổi theo điểm nhớ 0 đến 5, tối thiểu 1,3. Anki gọi bộ xếp lịch cũ là "SuperMemo 2 (SM-2)" với ease 2,50 riêng từng thẻ (https://docs.ankiweb.net/deck-options.html).
- Stride cùng ý tưởng giãn cách cấp số nhân nhưng không có ease riêng từng mục, nên gọi là SM-2 là không đúng. Luật Quảng cáo sửa đổi (75/2025/QH15, hiệu lực 2026-01-01) yêu cầu quảng cáo trung thực; người đọc kỹ thuật (Show HN) cũng sẽ soi.
- Founder duyệt 2026-11-18: giữ nguyên thuật toán (hợp với việc cần làm), chỉ sửa chữ. Bộ bài đăng đã sửa ở A14.

## Phạm vi
- Trong: `index.html` (meta, OG, Twitter, JSON-LD, nội dung noscript), `public/en/index.html`, `public/vi/index.html` (meta, JSON-LD, nội dung, câu hỏi thường gặp), `public/llms.txt`, `public/privacy.html`, `src/i18n/en.ts` và `vi.ts` (bảng so sánh, đoạn giới thiệu), `docs/02-growth/store-listings/microsoft-store-listing.md`, chú thích trong code có nói "chuẩn Anki SM-2".
- Ngoài: tên biến và tên component (`AnkiSrs...`) giữ nguyên vì không hiện cho khách; không đổi thuật toán.

## Cách nói thống nhất
- EN: "spaced repetition: each review pushes the next one further out (1, 3, 7, 16, 35 days, then about 2.2 times longer each step, up to a year)".
- VI: "ôn tập ngắt quãng: mỗi lần ôn, lần sau giãn xa hơn (1, 3, 7, 16, 35 ngày, rồi mỗi bậc khoảng gấp 2,2 lần, tối đa 1 năm)".
- Không nêu tên AnkiWeb (theo commit debeca3).

## Tiêu chí nghiệm thu
- [x] Không còn "SM-2", "the algorithm behind Anki", "thuật toán của Anki" trong mọi file trên (chỉ còn chú thích code giải thích vì sao KHÔNG phải SM-2).
- [x] Lint, test app (81, gồm test bộ dịch EN/VI), test Worker (45), quét bí mật qua.
- [ ] Production: `/`, `/en/`, `/vi/`, `/llms.txt` không còn "SM-2"; sitemap lastmod cập nhật; yêu cầu Google lập chỉ mục lại `/`, `/en/`, `/vi/`.

## Rủi ro & rollback
- Mất từ khóa "SM-2" trên trang đích: lượng tìm kiếm rất nhỏ so với "spaced repetition"; chấp nhận. Rollback bằng revert.
