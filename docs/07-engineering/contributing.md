# 7. Contributing & Git Commit Standards

## 7.1. Chuẩn Commit Quốc Tế (Conventional Commits v1.0.0)

Mọi kỹ sư tham gia dự án **bắt buộc** phải tuân thủ nghiêm ngặt định dạng:

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Các Tiền Tố Bắt Buộc (Type):
- **`feat`**: Một tính năng mới cho người dùng.
- **`fix`**: Sửa một lỗi hệ thống hoặc giao diện.
- **`refactor`**: Tái cấu trúc mã nguồn không làm thay đổi hành vi bên ngoài.
- **`perf`**: Cải thiện hiệu năng xử lý hoặc render.
- **`style`**: Điều chỉnh khoảng cách, căn chỉnh Tailwind CSS (không ảnh hưởng logic).
- **`docs`**: Cập nhật hoặc bổ sung tài liệu kỹ thuật.
- **`test`**: Bổ sung hoặc sửa đổi các kịch bản kiểm thử.
- **`chore`**: Cập nhật gói phụ thuộc, cấu hình build.

### Ví Dụ Chuẩn Mực:
```bash
feat(tasks): implement notion-style caret navigation toggle
fix(subtasks): pass parentSubId through App.tsx to support infinite nesting depth
style(layout): optimize 4pt/8pt text layout spacing grid
docs(readme): add enterprise-grade docs folder structure
```

---

## 7.2. Quy Tắc Clean Code & Anti-Slop (Frontend Design Constitution)
1. **Không tạo khoảng trắng rác**: Không lạm dụng padding quá lớn; giữ giao diện cô đọng và hữu dụng.
2. **Không dùng inline styles bừa bãi**: Luôn dùng lớp tiện ích Tailwind CSS chuẩn hóa.
3. **Phân tách trách nhiệm**:
   - Component chỉ phụ trách render giao diện.
   - Logic dữ liệu, thuật toán đệ quy phải nằm riêng trong `utils/subtaskTree.ts` và hook `useTaskManager.ts`.
4. **Không để cảnh báo ESLint / TypeScript lọt qua**: Mọi file phải vượt qua `npm run lint` và `npm run build`.
