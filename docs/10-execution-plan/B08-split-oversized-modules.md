# B08 — Tách các file quá lớn (SRP)

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | B — Foundation |
| Ưu tiên | P2 (làm dần, xen kẽ việc khác) |
| Ước lượng | Liên tục — mỗi PR một file |
| Phụ thuộc | B01, B02 |
| Trạng thái | ☐ Todo |

## Mục tiêu
Không file nào trong `src/` vượt 300 dòng (từ điển i18n tách theo namespace); logic miền tách khỏi hook React.

## Thứ tự ưu tiên (rủi ro & giá trị cao trước)
1. `useTaskManager.ts` (1.002) · 2. `App.tsx` (869) · 3. `useTaskCRUD.ts` (650) · 4. `useProLicense.ts` (501) · 5. `persistentStorage.ts` (492) · 6. `TaskDetailModal.tsx` (749) · 7. `PinnedSection.tsx` (738) · 8. `BackupModal.tsx` (708) · 9. i18n `vi/en/types` (~570) · 10. phần còn lại (danh sách đầy đủ: `find src -name '*.ts*' | xargs wc -l | sort -rn`).

Cách tách từng file: [../04-architecture/03-frontend-architecture.md](../04-architecture/03-frontend-architecture.md) mục 6.

## Quy trình mỗi PR
1. Viết characterization test cho hành vi hiện tại của file.
2. Tách theo trách nhiệm (domain thuần → `domain/`, use case → `application/`, hook mỏng → `ui/`).
3. Component chạm tới chuyển sang design token ([../08-design-system/02-design-tokens.md](../08-design-system/02-design-tokens.md)).
4. Không đổi khóa lưu trữ, không đổi hành vi; test xanh; bundle không vượt ngân sách.

## Tiêu chí nghiệm thu (toàn task)
- [ ] `find src -name '*.ts*' -exec wc -l {} + | awk '$1>300'` chỉ còn file tổng.
- [ ] Lint ranh giới import ở mức `error` cho toàn bộ `src/`.
