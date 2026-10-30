# 04 — Architecture

> **Thuộc**: 04-architecture · **Trạng thái**: Draft v1 · **Cập nhật**: 2026-10-30
> **Tôn chỉ**: *Microservices-ready modular architecture* — chia hệ thống theo **bounded context** với ranh giới cứng như microservices, nhưng **chỉ tách thành dịch vụ triển khai riêng khi có lý do đo được** (ADR-0005). Mọi module tuân thủ SOLID và quy tắc phụ thuộc hướng vào trong (Clean/Hexagonal Architecture).

## Thứ tự đọc

| # | File | Nội dung |
| :---: | :--- | :--- |
| 1 | [01-system-context-c4.md](./01-system-context-c4.md) | Sơ đồ C4 (Context, Container) hiện tại và mục tiêu |
| 2 | [02-principles-solid-ddd-microservices.md](./02-principles-solid-ddd-microservices.md) | Nguyên lý bắt buộc: bounded context, SOLID áp vào code thật, luật microservices, điều kiện tách dịch vụ |
| 3 | [03-frontend-architecture.md](./03-frontend-architecture.md) | Lớp & module phía client, quy tắc import, bản đồ refactor file quá lớn |
| 4 | [04-backend-services-cloudflare.md](./04-backend-services-cloudflare.md) | Dịch vụ trên Cloudflare Workers: gateway, licensing, billing, sync, notifications |
| 5 | [05-data-model-and-storage.md](./05-data-model-and-storage.md) | Dữ liệu client/server, khóa lưu trữ, snapshot đồng bộ, quy tắc migration |
| 6 | [06-target-repository-structure.md](./06-target-repository-structure.md) | Cấu trúc monorepo mục tiêu và lộ trình di chuyển từng bước |
| — | [adr/](./adr/README.md) | Nhật ký quyết định kiến trúc (ADR) |

## Tài liệu chuyên sâu sẵn có (giữ nguyên)

- [system-overview.md](./system-overview.md) — luồng dữ liệu một chiều, cấu trúc mã nguồn.
- [recursive-subtasks.md](./recursive-subtasks.md) — thuật toán cây việc con (Cascade Down, Bubble Up Rollup).
- [state-persistence.md](./state-persistence.md) — bảng khóa localStorage, Undo 4,5 giây, Audio Engine.
