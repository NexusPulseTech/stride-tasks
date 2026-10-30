# Khách hàng mục tiêu (ICP) & Jobs-to-be-Done

> **Thuộc**: 01-business · **Trạng thái**: Draft v1, *giả thuyết, phải kiểm chứng bằng phỏng vấn* · **Cập nhật**: 2026-10-30
> **Mục đích**: chọn đúng người để nói chuyện và bán trước. Sản phẩm mới không bán cho "tất cả mọi người".

## 1. Ba phân khúc

> **Thứ tự ưu tiên từ 2026-10-30 (ADR-0009)**: B (riêng tư, toàn cầu) và A (tự học, toàn cầu) là chính; C (Việt Nam) là kênh phụ. Thông điệp và nội dung viết tiếng Anh trước.

### A. Người tự học / ôn thi (wedge chính)

- **Ai**: sinh viên, người ôn chứng chỉ (IELTS, JLPT, AWS…), người học ngoại ngữ, người tự học lập trình.
- **JTBD**: *"Khi tôi phải ôn nhiều môn/chủ đề cùng lúc, tôi muốn biết **hôm nay cần ôn lại gì** và tập trung làm từng phần, để không quên kiến thức và không bị quá tải."*
- **Nỗi đau hiện tại**: Anki cho flashcard, Notion/giấy cho kế hoạch, app hẹn giờ riêng → chuyển ngữ cảnh liên tục; không có công cụ nào lập lịch **ôn lại công việc/chủ đề** (không phải thẻ).
- **Vì sao Stride thắng**: SM-2 cho việc + Pomodoro + nhập nhanh một dòng, chạy offline trong lớp/thư viện.
- **Sẵn sàng chi trả**: thấp-trung bình → phù hợp giá PPP và mua một lần.
- **Tụ tập ở đâu**: r/GetStudying, r/studytips, r/Anki, r/languagelearning, r/IELTS; server Discord "study with me"; nhóm Facebook tự học IELTS/ôn thi đại học; TikTok/YouTube "study with me".

### B. Người làm việc trí óc coi trọng quyền riêng tư

- **Ai**: lập trình viên, freelancer, nhà nghiên cứu, người làm nội dung.
- **JTBD**: *"Tôi muốn danh sách việc **chạy offline, không cần tài khoản**, dữ liệu thuộc về tôi, và khi cần thì đồng bộ được mà không ai đọc được."*
- **Vì sao Stride thắng**: local-first, E2E (máy chủ chỉ giữ bản mã), repo public để tự kiểm chứng.
- **Sẵn sàng chi trả**: trung bình-cao → mức $25.95 hợp lý.
- **Tụ tập ở đâu**: Hacker News, Lobsters, r/privacy, r/productivity, r/selfhosted (lân cận), dev.to, Viblo.

### C. Người dùng Việt Nam (thị trường sân nhà)

- **Ai**: sinh viên, nhân viên văn phòng trẻ, người làm tự do.
- **Lợi thế**: giao diện tiếng Việt, giá 199.000₫, **chuyển khoản VietQR quen thuộc**, founder nói cùng ngôn ngữ → bán trực tiếp nhanh nhất.
- **Tụ tập ở đâu**: nhóm Facebook (năng suất, tự học, IT), Voz, Spiderum, Tinhte, Viblo, TikTok.

## 2. Persona tóm tắt

| Persona | Bối cảnh | Kích hoạt mua PRO |
| :--- | :--- | :--- |
| **Linh, 21, sinh viên năm 3** | Ôn 5 môn + IELTS, học ở thư viện, laptop Windows + Android | Muốn đồng bộ laptop ↔ điện thoại; vượt 5 dự án (mỗi môn 1 dự án) |
| **Minh, 29, backend dev** | Ghét app bắt đăng nhập, dùng nhiều máy | Đồng bộ E2E giữa máy công ty và máy nhà |
| **Sarah, 34, người học tiếng Nhật (quốc tế)** | Ôn JLPT N3 theo chủ đề, dùng Anki | Lịch ôn chủ đề + Pomodoro trong một app, giá PPP |

## 3. Anti-ICP (chủ động không nhắm)

- Nhóm/doanh nghiệp cần cộng tác, phân quyền, chat.
- Người muốn AI tự lập kế hoạch cho mình.
- Người chỉ dùng hệ sinh thái Apple và đã hài lòng với Things 3.

## 4. Kịch bản phỏng vấn khách hàng (15 phút, 10-15 người trước khi xây tính năng mới)

1. Lần gần nhất bạn phải ôn/làm nhiều việc cùng lúc là khi nào? Bạn đã quản lý nó thế nào?
2. Công cụ hiện tại bạn dùng? Điều gì khiến bạn bực nhất?
3. Bạn đã từng **trả tiền** cho app năng suất nào chưa? Bao nhiêu, vì sao?
4. (Cho xem Stride 2 phút) Điều gì bạn thấy hữu ích nhất? Điều gì khó hiểu?
5. Nếu hôm nay cần trả tiền để đồng bộ giữa các thiết bị, mức giá nào bạn thấy "rẻ", "hợp lý", "đắt"? *(câu hỏi kiểu Van Westendorp rút gọn)*

**Tín hiệu tốt**: người được hỏi kể chuyện cụ thể, đã từng trả tiền cho công cụ tương tự, hỏi "dùng thử ở đâu".
**Tín hiệu xấu**: "hay đấy" chung chung, không có ví dụ, không quan tâm đồng bộ.

Ghi kết quả từng cuộc phỏng vấn vào bảng (ngày, phân khúc, nỗi đau, công cụ hiện tại, mức giá) để cập nhật lại tài liệu này.
