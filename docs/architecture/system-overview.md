# 1. System Overview Architecture

## 1.1. Triết Lý & Mục Tiêu Thiết Kế
Solo Checklist là ứng dụng quản lý công việc và dự án cá nhân hiệu năng cao, tối ưu cho sự tập trung sâu (Deep Focus) và thao tác nhanh chóng (Frictionless Execution).

### 3 Nguyên Tắc Cốt Lõi:
1. **Zero-Friction Fast Entry**: Tạo việc con, dán hàng loạt markdown, phân cấp nhiệm vụ không quá 1 phím nhấn (`Enter`, `Esc`).
2. **Deterministic Unidirectional Data Flow**: Trạng thái là nguồn chân lý duy nhất (Single Source of Truth), luồng dữ liệu 1 chiều (React Hooks + Pure Functions).
3. **No Bad Wheels (Không tạo bánh xe hỏng)**: Áp dụng các mẫu hình (patterns) đã được khẳng định từ Notion (Sub-items tree), Linear (Keyboard & Status transitions), Radix UI (Portal Stacking Context), và Apple HIG (Compact 4pt/8pt Grid).

---

## 1.2. Sơ Đồ Luồng Dữ Liệu (Unidirectional Data Flow)

```
[ User Interaction ]
   │
   ├─► Click Checkbox ───────────► toggleTaskDone / toggleSubTask
   ├─► Click Toggle Caret (▶/▼) ─► toggleExpandSubtasks (Mở/Đóng cây)
   ├─► Thêm việc con vô hạn ─────► handleAddSubTask (projId, taskId, title, parentId)
   └─► Mở Popover / Dialog ──────► PortalMenu / ConfirmDialog (React Portal)
           │
           ▼
[ Feature Hook: useTaskManager ]
   │
   ├─► Pure Graph Algorithms (`subtaskTree.ts`)
   │      ├─ Cascade Down: Cha xong ➔ toàn bộ con cháu xong
   │      ├─ Bubble Up Rollup: Mọi lá con xong ➔ cha tự động xong
   │      └─ Incomplete Rollup: Bỏ tick 1 con ➔ cha tự động về 'doing'
   │
   ├─► LocalStorage Persistence (`checklist_projects_v2`)
   ├─► Web Audio API Synth (Chime ngũ cung trong sáng khi xong việc)
   └─► Haptic Feedback (Vibration API 15ms khi bấm)
           │
           ▼
[ Re-render Pipeline ]
   │
   ├─► App.tsx
   ├─► ProjectCard.tsx
   ├─► TaskItem.tsx (Notion Toggle Caret + Checkbox)
   └─► SubtaskList.tsx (Đệ quy vô hạn tầng SubTaskRow)
```

---

## 1.3. Cấu Trúc Mã Nguồn (Modular Architecture)

```
src/
├── components/                  # UI Components dùng chung toàn app
│   ├── feedback/                # Toast, Confetti celebration
│   ├── layout/                  # Header, QuickStatsBar, MobileGuideModal
│   └── ui/                      # PortalMenu, ConfirmDialog, BatchPasteModal
│
├── features/                    # Tính năng được đóng gói theo Domain-Driven Design
│   ├── analytics/               # Streak tracking, progress math
│   ├── focus/                   # Focus Mode filter
│   ├── modals/                  # Clean state confirmation modals
│   └── tasks/                   # Trọng tâm nghiệp vụ quản lý Task & Subtasks
│       ├── components/          # TaskItem, SubtaskList, ProjectCard, ActionBar
│       ├── hooks/               # useTaskManager
│       └── utils/               # subtaskTree, formatters, batchParser
│
├── types/                       # TypeScript interfaces chuẩn hóa (Task, SubTask, Project)
└── utils/                       # audioChime, haptics, storage
```
