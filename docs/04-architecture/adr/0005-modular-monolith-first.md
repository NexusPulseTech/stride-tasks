# ADR-0005: Thiết kế microservices-ready, tách dịch vụ khi đạt điều kiện

- **Trạng thái**: Proposed
- **Ngày**: 2026-10-30
- **Liên quan**: [../02-principles-solid-ddd-microservices.md](../02-principles-solid-ddd-microservices.md), task D01

## Bối cảnh

Mục tiêu dài hạn là kiến trúc microservices dễ mở rộng. Hiện tại: một người phát triển, lưu lượng nhỏ, mục tiêu trước mắt là khách trả tiền đầu tiên. Tách dịch vụ quá sớm làm tăng chi phí vận hành, độ trễ và lỗi tích hợp (distributed monolith).

## Các phương án

1. **Microservices ngay** (5 Worker + queue) — đúng "hình dạng" mục tiêu nhưng nhân chi phí deploy, test, gỡ lỗi khi chưa có nhu cầu.
2. **Monolith không ranh giới** — nhanh lúc đầu, đắt khi tách sau.
3. **Modular monolith với ranh giới bounded context cứng, tách theo điều kiện** — mỗi context có domain/application/adapter riêng, giao tiếp qua interface; khi tách chỉ thay adapter in-process bằng Service Binding.

## Quyết định

Chọn phương án 3. Điều kiện tách (ít nhất một): ranh giới bảo mật khác nhau, nhịp deploy khác nhau, nhu cầu tài nguyên khác nhau, có nhóm sở hữu riêng. Ứng viên tách đầu tiên: **billing + licensing** (cô lập khóa ký và secret thanh toán khỏi API đồng bộ công khai).

## Hệ quả

- Tích cực: chi phí thấp bây giờ, đường tách rõ ràng sau này; test domain không phụ thuộc hạ tầng.
- Tiêu cực: phải kỷ luật giữ ranh giới (cần lint tự động — task B02).
- Việc tiếp: khi tách, viết ADR mới ghi điều kiện nào đã thỏa.
