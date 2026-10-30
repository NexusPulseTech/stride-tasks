# Sơ đồ hệ thống (mô hình C4)

> **Thuộc**: 04-architecture · **Trạng thái**: Reviewed (hiện tại) / Draft (mục tiêu) · **Cập nhật**: 2026-10-30
> **Chuẩn**: C4 model (Simon Brown) — Level 1 *System Context*, Level 2 *Container*.

## 1. Level 1 — System Context (hiện tại)

```mermaid
flowchart LR
  user([Người dùng<br/>trình duyệt / PWA / Windows])
  buyer([Người mua])
  stride[Stride Tasks<br/>app local-first + API edge]
  sepay[SePay<br/>biến động số dư VietQR]
  mor[Merchant of Record<br/>Polar · LemonSqueezy cũ]
  mail[Dịch vụ email<br/>Resend — tùy chọn]
  user -->|quản lý việc offline,<br/>đồng bộ bản mã| stride
  buyer -->|chuyển khoản VietQR| sepay
  buyer -->|thẻ quốc tế| mor
  sepay -->|webhook giao dịch| stride
  mor -->|webhook đơn hàng| stride
  stride -->|link kích hoạt| mail
```

## 2. Level 2 — Container (hiện tại, v3.1.0)

```mermaid
flowchart TB
  subgraph Client["Thiết bị người dùng"]
    spa["Web App SPA<br/>React 19 + Vite 8<br/>tasks.nexuspulsetech.xyz (GitHub Pages qua Cloudflare)"]
    sw["Service Worker<br/>Workbox precache"]
    store[("localStorage + IndexedDB<br/>dữ liệu công việc, token PRO")]
    tauri["Tauri 2 shell (Windows)<br/>nạp cùng bundle dist/"]
    spa --- sw
    spa --- store
    tauri --- spa
  end
  subgraph Edge["Cloudflare (tasks-api.nexuspulsetech.xyz)"]
    worker["Worker stride-license<br/>1 file JS: webhook, claim, sync"]
    kv[("KV LICENSES<br/>order:*, sepay:*, lsorder:*")]
    d1[("D1 stride-sync<br/>bảng vaults (bản mã)")]
    worker --- kv
    worker --- d1
  end
  spa -->|"GET/PUT/DELETE /sync/v1/vaults/{id}<br/>Bearer token PRO"| worker
  spa -->|"GET /claim?order=…"| worker
  ext["SePay / MoR"] -->|"POST /webhook/*"| worker
```

**Đặc điểm**: toàn bộ logic nghiệp vụ người dùng chạy trên client; server **không đọc được** dữ liệu công việc (chỉ bản mã AES-256-GCM). Worker là một khối duy nhất chứa cả bí mật thanh toán lẫn API đồng bộ.

## 3. Level 2 — Container (mục tiêu, Phase D)

```mermaid
flowchart TB
  subgraph Client["Thiết bị người dùng"]
    web["apps/web — PWA"]
    desk["apps/desktop — Tauri"]
    site["site — trang marketing tĩnh (Astro)"]
  end
  subgraph Edge["Cloudflare Workers"]
    gw["gateway<br/>CORS · rate limit · request-id · lỗi RFC 9457"]
    lic["licensing-service<br/>ký/xác minh/thu hồi token"]
    bill["billing-service<br/>webhook SePay/Polar · sổ cái đơn"]
    sync["sync-service<br/>kho bản mã"]
    notif["notification-service<br/>email kích hoạt"]
    q[["Queue: billing.order-paid"]]
    gw -->|Service Binding RPC| lic
    gw -->|Service Binding RPC| sync
    gw -->|Service Binding RPC| bill
    bill --> q --> lic
    lic --> notif
  end
  kvL[("KV/D1 licensing")]
  d1B[("D1 billing")]
  d1S[("D1 sync")]
  lic --- kvL
  bill --- d1B
  sync --- d1S
  web --> gw
  desk --> gw
  mor["Polar / SePay"] --> gw
```

Nguyên tắc mục tiêu: **mỗi dịch vụ sở hữu dữ liệu riêng** (database-per-service), chỉ giao tiếp qua hợp đồng có phiên bản (HTTP OpenAPI công khai, RPC nội bộ, sự kiện). Khóa bí mật Ed25519 chỉ nằm trong `licensing-service` → bề mặt tấn công của API đồng bộ không chạm tới khóa ký. Chi tiết: [04-backend-services-cloudflare.md](./04-backend-services-cloudflare.md).
