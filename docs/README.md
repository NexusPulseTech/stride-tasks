# Solo Checklist - Documentation Hub & Engineering Wiki

Chào mừng các kỹ sư phát triển tiếp nối dự án **Solo Checklist (Checklist Cá Nhân Tinh Gọn)**.  
Hệ thống tài liệu này được thiết kế theo tiêu chuẩn kiến trúc phần mềm của các tập đoàn công nghệ hàng đầu thế giới (Google, Stripe, Linear, Notion), nhằm đảm bảo tính kế thừa, khả năng mở rộng (scalability), và chất lượng code cao nhất theo tôn chỉ:

> **"Không tạo bánh xe hỏng — Học hỏi và áp dụng triệt để các best-practice đã được chứng minh trong ngành công nghiệp phần mềm."**

---

## 🗺️ Bản Đồ Cấu Trúc Tài Liệu (Documentation Directory)

```
docs/
├── README.md                                  # Trung tâm điều hướng & Bản đồ tài liệu (Tài liệu này)
│
├── architecture/                              # Kiến trúc kỹ thuật chuyên sâu
│   ├── system-overview.md                     # Tổng quan hệ thống, luồng dữ liệu một chiều & sơ đồ khối
│   ├── recursive-subtasks.md                  # Giải thuật Đệ quy Việc con vô hạn tầng (Rollup & Cascade)
│   └── state-persistence.md                   # Kiến trúc lưu trữ LocalStorage, Undo/Redo & Audio Engine
│
├── design-system/                             # Quy chuẩn giao diện & UX
│   ├── notion-hierarchy-ux.md                 # Thiết kế cây thư mục, Caret Navigation & Lưới khoảng cách 4pt/8pt
│   └── portal-dialogs.md                      # Kiến trúc React Portal & Quản trị Stacking Context (Z-index 99999)
│
├── development/                               # Quy chuẩn kỹ thuật & Đóng góp
│   ├── getting-started.md                     # Hướng dẫn thiết lập môi trường, Scripts & Build
│   └── contributing.md                        # Tiêu chuẩn Git Conventional Commits v1.0.0 & Code Style
│
├── standards/                                 # Quy chuẩn chất lượng code & Thiết kế
│   ├── file-size-and-modularity.md            # Tiêu chuẩn <= 300 dòng/file (SLOC), Clean Code & Hook Composition
│   └── color-system-and-palette.md            # Quy tắc 60-30-10, Bảng màu Notion/Linear & Chống lỗi "Rainbow Slop"
│
└── guides/                                    # Hướng dẫn vận hành & Kế thừa
    ├── user-guide.md                          # Cẩm nang người dùng cuối, Cú pháp Dán nhanh & Phím tắt
    └── maintenance-and-inheritance.md         # Hướng dẫn bàn giao, Kiểm thử hồi quy & Mở rộng tính năng

├── Release/                                   # Nhật ký Phát hành & Kiến trúc Thương mại hóa (Changelog Hub)
│   ├── README.md                              # Danh mục các đợt phát hành & Quy chuẩn Release Notes
│   ├── 2026-10-27-v3.0.0-omni-channel-and-execution-engine.md # Báo cáo cập nhật 10/27/2026 (v2.5.0 -> v3.0.0)
│   └── AI-AUDIT-AND-SYNC-PROMPT.md            # Prompt mẫu để AI rà soát & đồng bộ code ↔ tài liệu
```

---

## ⚡ Lộ Trình Đọc Nhanh Dành Cho Kỹ Sư Mới

1. **Báo cáo Phát hành Mới nhất (10/27/2026 — `v3.0.0`)**: Xem [Release/2026-10-27-v3.0.0-omni-channel-and-execution-engine.md](./Release/2026-10-27-v3.0.0-omni-channel-and-execution-engine.md) để nắm rõ bộ NLP nhập việc nhanh, Kanban, Pomodoro & nhật ký Deep Work, và kiến trúc bản quyền Ed25519 + giá theo khu vực (VietQR / LemonSqueezy).
2. **Hiểu nhanh kiến trúc tổng thể**: Xem [architecture/system-overview.md](./architecture/system-overview.md).
3. **Cơ chế Việc con vô hạn tầng**: Xem [architecture/recursive-subtasks.md](./architecture/recursive-subtasks.md) để nắm rõ toán học đằng sau 2 thuật toán **Cascade Down** và **Bubble Up Rollup**.
4. **Quy chuẩn Giao diện & Trải nghiệm (Notion UX)**: Xem [design-system/notion-hierarchy-ux.md](./design-system/notion-hierarchy-ux.md).
5. **Quy chuẩn Commit & Đóng góp**: Xem [development/contributing.md](./development/contributing.md) trước khi tạo bất kỳ commit nào.
6. **Kế thừa & Bàn giao hệ thống**: Xem [guides/maintenance-and-inheritance.md](./guides/maintenance-and-inheritance.md).
