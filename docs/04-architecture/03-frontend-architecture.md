# Kiến trúc frontend

> **Thuộc**: 04-architecture · **Trạng thái**: Draft v1 (mục tiêu) · **Cập nhật**: 2026-10-30
> **Áp dụng**: `src/` (sau D01: `apps/web/src/`). Bổ sung cho [system-overview.md](./system-overview.md) (luồng dữ liệu một chiều hiện tại).

## 1. Hiện trạng

```
src/
├── App.tsx               # composition root + nhiều logic (869 dòng)
├── components/           # layout/, ui/, feedback/, dùng chung
├── config/ constants/    # cấu hình thương mại, hằng số khóa lưu trữ
├── features/             # analytics/, focus/, modals/, sync/, tasks/  (mỗi feature có index.ts)
├── hooks/                # useProLicense.ts (501 dòng), …
├── i18n/                 # vi.ts, en.ts, types.ts (khóa dịch có kiểu)
├── types/ utils/         # kiểu dùng chung, tiện ích (persistentStorage.ts 492 dòng)
```

Điểm tốt đã có: feature folder + barrel `index.ts`, lazy-load modal (`React.lazy` + `Suspense`), khóa i18n có kiểu, tách chunk vendor/icons/sync-engine.
Điểm cần sửa: logic miền nằm trong hook React (khó test), import sâu giữa feature, `features/modals/` là thư mục theo *kiểu kỹ thuật* chứ không theo *nghiệp vụ*, 29 file > 300 dòng.

## 2. Cấu trúc mục tiêu (Feature-Sliced + Hexagonal)

```
src/
├── app/                          # composition root: providers, ErrorBoundary, ModalHost, chọn adapter
├── features/
│   └── <context>/                # tasks | focus | review | insights | sync | entitlements | billing-ui
│       ├── domain/               # entity, value object, policy, hàm thuần, KHÔNG React/DOM
│       ├── application/          # use case (command/query) + port (interface)
│       ├── infrastructure/       # adapter: storage, http, crypto
│       ├── ui/                   # component + hook React (mỏng, gọi use case)
│       └── index.ts              # public API duy nhất của context
└── shared/
    ├── ui/                       # primitive của design system (Button, Dialog, PortalMenu, Toast)
    ├── lib/                      # tiện ích thuần không nghiệp vụ (date, id, result)
    ├── i18n/                     # hạ tầng dịch + từ điển theo namespace
    └── config/                   # đọc env (VITE_*) có kiểm tra kiểu
```

Ánh xạ từ hiện tại: `features/modals/*` → chuyển về context sở hữu (VD `MarkdownReportModal` → `insights/ui`, `StoreCommercialModal` → `entitlements/ui`, `BackupModal` → `tasks/ui` hoặc `platform`); `hooks/useProLicense.ts` → `features/entitlements/`; `utils/persistentStorage.ts` → `shared/lib/storage` (port + adapter).

## 3. Quy tắc import (kiểm tra bằng ESLint trong CI)

| Từ \ Tới | `domain` | `application` | `infrastructure` | `ui` | context khác | `shared` |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `domain` | ✅ | ❌ | ❌ | ❌ | ❌ | chỉ `shared/lib` |
| `application` | ✅ | ✅ | ❌ | ❌ | qua `index.ts` | ✅ |
| `infrastructure` | ✅ | ✅ (port) | ✅ | ❌ | ❌ | ✅ |
| `ui` | ✅ | ✅ | ❌ | ✅ | qua `index.ts` | ✅ |
| `app/` | ✅ | ✅ | ✅ | ✅ | qua `index.ts` | ✅ |

## 4. Quản lý trạng thái

- Giữ mô hình hiện tại (hook + state cục bộ + persistence), **không** thêm Redux.
- State phức tạp dùng `useReducer` với reducer thuần nằm ở `domain/` (test không cần React).
- Chỉ cân nhắc thư viện store nhẹ (VD Zustand) khi prop drilling vượt 3 tầng ở ≥ 3 nơi, phải có ADR.
- Mọi ghi xuống lưu trữ đi qua port `Repository` để: kiểm tra schema khi đọc (dữ liệu hỏng → khôi phục, không crash), áp migration theo phiên bản, đánh dấu `updatedAt` tập trung (đã làm trong `setProjects`).

## 5. Lỗi, hiệu năng, an toàn

- **Error Boundary**: một boundary toàn cục (màn hình "Có lỗi, dữ liệu của bạn an toàn, tải lại / xuất sao lưu") + boundary quanh mỗi vùng lazy (Kanban, Stats, modal), task `B04`.
- **Ngân sách bundle**: chunk chính ≤ 470 kB (hiện 415,8 kB), mục tiêu ≤ 400 kB; mỗi modal lazy ≤ 30 kB, xem [../07-engineering/05-performance-budgets.md](../07-engineering/05-performance-budgets.md).
- **Không chuỗi cứng trong UI**: mọi văn bản qua i18n (đã có kiểu); lint chặn chuỗi JSX cứng ở `ui/`.
- **Cấu hình**: đọc `import.meta.env` ở **một** nơi (`shared/config`), trả về object có kiểu; component không đọc env trực tiếp.

## 6. Bản đồ refactor các file quá lớn (task `B08`, làm dần, mỗi PR một file)

| File (dòng) | Tách thành |
| :--- | :--- |
| `features/tasks/hooks/useTaskManager.ts` (1.002) | `useTaskStore` · `taskCommands` (use case) · `syncSnapshotAdapter` · `useUndoBuffer` · `useSelection` |
| `App.tsx` (869) | `app/AppShell` · `app/Providers` · `app/ModalHost` · `app/useHashRouting` (`#activate=`, `#sync=`) |
| `features/tasks/components/TaskDetailModal.tsx` (749) | Các section: header, metadata, subtasks, SRS, notes |
| `features/tasks/components/PinnedSection.tsx` (738) | `PinnedList` · `PinnedItem` · `usePinnedDrag` |
| `features/modals/components/BackupModal.tsx` (708) | `backup/domain` (định dạng, kiểm tra) · `BackupExport` · `BackupRestore` |
| `features/tasks/hooks/useTaskCRUD.ts` (650) | Use case thuần trong `tasks/application` + hook mỏng |
| `i18n/vi.ts`, `en.ts`, `types.ts` (~570) | Tách theo namespace: `tasks`, `focus`, `sync`, `store`, `common` |
| `hooks/useProLicense.ts` (501) | `entitlements/domain` (policy hạn mức, trial) · `licensing/infrastructure` (verify token, lưu trữ) · `useEntitlements` |

**Quy tắc an toàn khi refactor**: viết test đặc tả hành vi hiện tại *trước* (characterization test), refactor không đổi hành vi, giữ nguyên khóa lưu trữ.
