# 5. Portal Dialogs & Stacking Context Architecture

## 5.1. Vấn Đề Lịch Sử: Hiện Tượng Bị Che Khuất (Stacking Context Clipping)
Trong CSS truyền thống, khi một menu hoặc hộp thoại được render bên trong một component cha có thuộc tính `overflow: hidden`, `position: relative`, hoặc `transform`:
- Phần tử menu con sẽ bị giới hạn bởi Stacking Context của cha.
- Khi người dùng bấm nút 3 chấm trong Task hoặc Subtask, menu popover bị cắt đứt cạnh mép hoặc bị các card dự án khác che khuất (z-index không có tác dụng xuyên qua stacking context).

---

## 5.2. Giải Pháp Chuẩn Công Nghiệp: React Portal (DOM Hoisting)

Hệ thống triển khai `createPortal` từ `react-dom` cho **toàn bộ** các thành phần nổi (Popovers, Dropdowns, Confirm Modals, Batch Paste):

```typescript
import { createPortal } from 'react-dom';

export function PortalMenu({ isOpen, onClose, triggerRef, children }: PortalMenuProps) {
  // 1. Tính toán tọa độ chính xác bằng getBoundingClientRect()
  const rect = triggerRef.current.getBoundingClientRect();
  
  // 2. Chuyển render ra ngoài cùng thẻ document.body
  return createPortal(
    <div 
      className="fixed inset-0 z-[99999]" 
      onClick={onClose}
    >
      <div 
        style={{ top: rect.bottom + 4, left: rect.right - menuWidth }}
        className="fixed bg-white dark:bg-[#1c2128] shadow-xl border ..."
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
```

### Bảng Phân Cấp Z-Index Tuyệt Đối:
- **`z-[99999]`**: Hộp thoại cảnh báo (`ConfirmDialog`), Dialog dán hàng loạt (`BatchPasteModal`), Menu tùy chọn (`PortalMenu`).
- **`z-[50]`**: Thanh điều khiển nổi (`ActionBar`), Hộp thoại hướng dẫn thiết bị (`MobileGuideModal`).
- **`z-[40]`**: Thanh thông báo nhanh (`ToastNotification`), Khung Hoàn tác (`UndoToast`).
- **`z-[10]`**: Tiêu đề trang ghim cố định (`Header`).
- **`z-[1]` - `z-[5]`**: Thẻ dự án, các mục công việc trong luồng văn bản thông thường.
