# 6. Getting Started & Development Workflow

## 6.1. Yêu Cầu Môi Trường (Prerequisites)
- **Node.js**: v18.0.0 hoặc v20.x trở lên
- **Trình quản lý gói**: `npm` hoặc `bun`
- **Port mặc định**: Cổng `3000` (theo ràng buộc môi trường AI Studio)

---

## 6.2. Các Lệnh Thực Thi (Development Scripts)

```bash
# 1. Cài đặt toàn bộ thư viện phụ thuộc
npm install

# 2. Khởi chạy Development Server (Port 3000)
npm run dev

# 3. Kiểm tra lỗi cú pháp và linter
npm run lint

# 4. Kiểm tra biên dịch TypeScript & đóng gói sản phẩm
npm run build
```

---

## 6.3. Kiểm Thử Hệ Thống (Manual Verification Checklist)
Trước khi bàn giao hoặc đẩy code lên nhánh chính:
1. Tạo 1 Task mới và kiểm tra trạng thái ban đầu là `todo`.
2. Bấm nút mũi tên điều hướng Caret (`▶`) trên Task để mở rộng cây subtask.
3. Thêm việc con tầng 1 ➔ thêm việc con tầng 2 ➔ tầng 3 ➔ tầng 4: Đảm bảo việc thêm liên tục thành công và hiển thị ngay tức thì.
4. Đánh dấu tick hoàn thành ở tầng sâu nhất: Kiểm tra bọt khí nổi (Bubble Up) tự động cập nhật nút cha.
5. Bấm nút 3 chấm (`···`) trong Task và Subtask: Kiểm tra menu mở ra lớp đầu tiên (`z-[99999]`), không bị che bởi bất kỳ phần tử nào.
6. Xóa thử một Task: Kiểm tra thanh Hoàn tác (Undo) 4.5s xuất hiện và khôi phục chính xác vị trí ban đầu.
