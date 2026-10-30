# Git workflow & phát hành

> **Thuộc**: 07-engineering · **Trạng thái**: Accepted · **Cập nhật**: 2026-10-30
> **Bổ sung cho**: [contributing.md](./contributing.md) (Conventional Commits) và `docs/Release/README.md` (chuẩn release notes).

## 1. Nhánh (trunk-based)

- `main` luôn deploy được; mọi thay đổi qua nhánh ngắn hạn `feat/…`, `fix/…`, `docs/…`, `chore/…` → Pull Request → CI xanh → squash merge.
- Bật **branch protection** cho `main`: yêu cầu CI (`ci.yml`) thành công, cấm force-push.
- Một PR = một mục đích (ưu tiên một task trong `docs/10-execution-plan/`), ≤ ~400 dòng thay đổi khi có thể.
- Commit message theo Conventional Commits; **không** thêm dòng attribution.

## 2. Phiên bản (SemVer)

| Tăng | Khi nào |
| :--- | :--- |
| MAJOR | Phá vỡ: định dạng lưu trữ cần migration không đảo ngược, API phá vỡ, bỏ tính năng đã bán |
| MINOR | Tính năng mới tương thích |
| PATCH | Sửa lỗi |

Nguồn phiên bản phải **đồng bộ** ở: `package.json`, `package-lock.json`, hằng số phiên bản trong `src/constants`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml` (+ `Cargo.lock`). Task D02 thêm script đồng bộ tự động.

## 3. Tag & release

- Mỗi bản phát hành có tag `vX.Y.Z` trên commit release. **Hiện thiếu tag `v3.0.0`, `v3.1.0`** (tag cuối là `v2.1.0`).
- ⚠️ Push tag `v*` kích hoạt `desktop-release.yml` (đang lỗi thời, chưa ký số) → sửa workflow (D02) **trước** khi tạo tag mới, hoặc tạm đổi trigger.
- Release notes: file trong `docs/Release/` theo chuẩn hiện có; GitHub Release dùng lại nội dung đó.

## 4. Trình tự phát hành chuẩn

1. Cập nhật phiên bản (mục 2) + release notes.
2. PR `chore(release): vX.Y.Z` → CI xanh → merge.
3. Web tự deploy (push `main`) → kiểm tra production (HTTP 200, asset, không lộ bí mật).
4. Nếu Worker thay đổi: `worker.yml` staging → duyệt → production → smoke test.
5. Tạo tag `vX.Y.Z` → bản desktop (khi D02 xong).
6. Cập nhật store (Microsoft Store) nếu gói thay đổi.
