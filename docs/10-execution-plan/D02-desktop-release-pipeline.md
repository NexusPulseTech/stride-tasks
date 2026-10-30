# D02 — Pipeline phát hành desktop

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | D — Scale |
| Ưu tiên | P2 |
| Ước lượng | 2–3 ngày |
| Phụ thuộc | B03 |
| Trạng thái | ☐ Todo |

## Mục tiêu
Tag `vX.Y.Z` tạo bản desktop đúng phiên bản, không bị cảnh báo bảo mật, tự cập nhật được.

## Vì sao
`desktop-release.yml` dùng action v4 (cảnh báo Node 20), `bun-version: latest` (không tái lập), `tauri-action@v0`, chưa ký số; release cuối `v2.1.0` chứa file tên `1.0.6`; `includeUpdaterJson: true` nhưng app chưa có plugin updater; thiếu tag `v3.0.0`, `v3.1.0`.

## Các bước
1. Script `scripts/sync-version.mjs`: đọc `package.json` → ghi `src-tauri/tauri.conf.json`, `Cargo.toml`, hằng số phiên bản trong `src/constants`; chạy trong `npm version` hook; CI kiểm tra khớp với tag.
2. Workflow: action major mới nhất (checkout/setup-node như `deploy.yml`), bỏ bun (sau khi xóa `bun.lock`, tauri-action dùng npm), ghim `tauri-apps/tauri-action` theo phiên bản đã kiểm tra, cache Rust.
3. Ký số Windows: đánh giá dịch vụ ký số cho cá nhân tại Việt Nam (khả dụng & chi phí); nếu không khả thi, **phân phối Windows qua Microsoft Store** (C05) và ghi rõ bản `.exe` trên GitHub là "chưa ký".
4. Tauri updater: `tauri signer generate` (khóa updater **riêng**, không phải khóa bản quyền), lưu private key vào GitHub secret, public key vào `tauri.conf.json`; endpoint là `latest.json` của GitHub Releases.
5. Release notes lấy từ `docs/Release/`.
6. Sau khi xong: tạo tag cho phiên bản hiện tại.

## Tiêu chí nghiệm thu
- [ ] Tag thử trên nhánh test sinh installer đúng tên phiên bản.
- [ ] Bản cũ tự phát hiện và cập nhật lên bản mới.
- [ ] Không còn cảnh báo deprecation trong workflow.
