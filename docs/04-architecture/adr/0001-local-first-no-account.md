# ADR-0001: Local-first, không bắt buộc tài khoản

- **Trạng thái**: Accepted (ghi nhận hồi tố quyết định đã có từ v1)
- **Ngày**: 2026-10-30
- **Liên quan**: [../02-principles-solid-ddd-microservices.md](../02-principles-solid-ddd-microservices.md), [../05-data-model-and-storage.md](../05-data-model-and-storage.md)

## Bối cảnh

Đối thủ lớn (Todoist, TickTick) bắt buộc tài khoản cloud. Một nhóm người dùng đáng kể muốn dùng ngay, offline, dữ liệu thuộc về mình. Founder vận hành một mình nên muốn chi phí server gần bằng 0.

## Các phương án

1. **Cloud-first, có tài khoản** — đồng bộ dễ, nhưng chi phí vận hành, trách nhiệm dữ liệu cá nhân lớn, mất điểm khác biệt.
2. **Local-first, không tài khoản; đồng bộ là tùy chọn mã hóa đầu-cuối** — chi phí thấp, riêng tư, khác biệt; đồng bộ phức tạp hơn.

## Quyết định

Chọn phương án 2. Dữ liệu công việc lưu trên thiết bị (localStorage + bản sao IndexedDB). Không có màn hình đăng ký. Đồng bộ (PRO) dùng mã đồng bộ ngẫu nhiên thay cho tài khoản.

## Hệ quả

- Tích cực: dùng được ngay; dữ liệu nhạy cảm không nằm trên server; chi phí hạ tầng ~0; điểm bán hàng rõ ràng.
- Tiêu cực: mất dữ liệu nếu người dùng xóa dữ liệu trình duyệt mà không sao lưu/đồng bộ → phải nhắc sao lưu; khó hỗ trợ khách (không xem được dữ liệu của họ); giới hạn dung lượng localStorage.
- Việc tiếp: cân nhắc chuyển kho chính sang IndexedDB khi dữ liệu lớn (ADR mới).
