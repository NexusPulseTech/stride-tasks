# Quản lý bí mật & khóa

> **Thuộc**: 06-security-privacy · **Trạng thái**: Accepted · **Cập nhật**: 2026-11-19 (B10: khóa ký đọc từ stdin hoặc tệp ngoài repo)
> **Bối cảnh**: repo `NexusPulseTech/stride-tasks` là **public**: một bí mật lọt vào commit coi như đã lộ vĩnh viễn (lịch sử git, bản fork, bộ nhớ đệm).

## 1. Danh mục bí mật

| Bí mật | Nơi lưu hợp lệ | Ai dùng | Hậu quả nếu lộ | Xoay vòng |
| :--- | :--- | :--- | :--- | :--- |
| `STRIDE_ED25519_PRIVATE_KEY` | Trình quản lý mật khẩu (bản lưu duy nhất trên máy founder, đưa vào script qua `--key-stdin`) · Worker secret. Tệp ngoài repo chỉ là dự phòng (mục 5). **Không** để trong `.env.local` hay bất kỳ tệp nào trong repo | Ký token PRO | Kẻ xấu tự phát hành PRO không giới hạn, tạo kho đồng bộ tùy ý | Khi nghi lộ (quy trình mục 3) |
| `SEPAY_API_KEY` | Worker secret · cấu hình webhook SePay | Xác thực webhook | Giả giao dịch → nhận PRO miễn phí | 6-12 tháng hoặc khi nghi lộ |
| `POLAR_WEBHOOK_SECRET`, `POLAR_ACCESS_TOKEN` | Worker secret | Xác thực webhook, tạo checkout | Giả đơn / thao tác tài khoản Polar | Theo khuyến nghị Polar |
| `LEMONSQUEEZY_SIGNING_SECRET` | Worker secret (sẽ gỡ) | Webhook cũ | Giả đơn | Gỡ khi bỏ kênh |
| `RESEND_API_KEY` | Worker secret | Gửi email | Gửi thư mạo danh từ domain | 12 tháng |
| `CLOUDFLARE_API_TOKEN` (CI) | GitHub Actions secret | Deploy Worker | Sửa/xóa Worker, đọc D1 | 90 ngày; quyền tối thiểu |
| OAuth Wrangler (máy founder) | `%APPDATA%/xdg.config/.wrangler` | Deploy thủ công | Như trên | `wrangler logout` khi không dùng; thu hồi tại *My Profile → Access Management → Connected Applications* |

**Không phải bí mật**: `LICENSE_PUBLIC_KEY` (nhúng trong app), ID KV/D1 (nhưng vẫn để trong `wrangler.toml` gitignore để không lộ cấu trúc tài khoản), URL Worker.

## 2. Quy tắc bắt buộc

1. Không bao giờ in bí mật ra terminal, log, issue, PR, chat. Script cần khóa đọc từ **stdin hoặc tệp ngoài repo** (`scripts/lib/signing-key.mjs`, mục 5) và không in giá trị. Phiên AI làm việc trong repo không đọc tệp khóa.
2. Trước mỗi commit chạm cấu hình: quét diff đã stage tìm mảnh khóa (đã làm thủ công ở v3.1.0; tự động hóa trong CI, task B03).
3. Bật **GitHub secret scanning + push protection** cho repo.
4. Nạp secret vào Worker bằng `npx wrangler secret put <NAME>` (nhập qua stdin), không đặt trong `[vars]`.
5. CI dùng token API riêng, quyền tối thiểu (*Account → Workers Scripts: Edit, D1: Edit, Workers KV: Edit*, chỉ account 54a0…), không dùng OAuth cá nhân.
6. Bí mật khác nhau cho `staging` và `production`.

## 3. Quy trình khi khóa riêng Ed25519 bị lộ

1. Sao lưu khóa cũ, rồi sinh cặp khóa mới bằng `npm run keygen -- init --force --out <tệp mới ngoài repo>`: lệnh này ghi khóa riêng mới ra tệp đó và **ghi đè** public key trong `src/utils/licenseCrypto.ts`. Trỏ `STRIDE_ED25519_PRIVATE_KEY_FILE` sang tệp mới, kiểm tra lại bằng `npm run keygen -- check`, nạp Worker bằng `npm run worker:secrets -- --key-only`.
2. Phát hành bản app nhận **cả hai** public key (cũ + mới) để token hợp lệ không bị khóa nhầm; thêm `kid` (key id) vào payload token mới.
3. Worker: chuyển sang ký bằng khóa mới; với sync, từ chối token ký bằng khóa cũ có `activatedAt` sau thời điểm lộ.
4. Phát lại token mới cho khách hàng hợp lệ (dựa vào sổ cái đơn hàng) qua email/link kích hoạt.
5. Sau một chu kỳ phát hành, bỏ public key cũ khỏi app.
6. Ghi sự cố vào [../09-operations/03-incident-response.md](../09-operations/03-incident-response.md).

## 4. Sao lưu

Khóa riêng có **một** bản sao offline (trình quản lý mật khẩu có mã hóa). Mất khóa = không phát hành được token mới cho khách hàng cũ cùng chữ ký → phải xoay khóa như mục 3. Tệp ngoài repo (phương án dự phòng ở mục 5) chỉ là bản làm việc tạm, không thay cho bản sao này.

## 5. Đưa khóa cho script (B10)

**Quyết định 2026-11-19: mặc định khóa chỉ nằm trong trình quản lý mật khẩu**, khi cần ký thì đưa vào script qua `--key-stdin`. Ký tay hiếm (Worker tự ký bằng secret của Cloudflare; ký tay chỉ dùng khi hỗ trợ khách), nên càng ít bản sao khóa càng an toàn và không phiên AI nào cần giữ khóa. Tệp ngoài repo (`--key-file`) chỉ là phương án dự phòng.

`npm run keygen` (lệnh `issue`, `check`) và `npm run worker:secrets` tìm khóa theo thứ tự:

1. `--key-stdin`: đọc từ ống, hoặc dán khi được hỏi (chữ không hiện). Cách gọn nhất là nối thẳng từ lệnh đọc của trình quản lý mật khẩu, khóa không nằm trên đĩa.
2. `--key-file <đường dẫn>`: tệp nằm ngoài thư mục repo.
3. `STRIDE_ED25519_PRIVATE_KEY_FILE`: đường dẫn tới tệp đó, đặt ở biến môi trường hoặc một dòng trong `.env.local` (đường dẫn không phải bí mật).
4. Biến môi trường `STRIDE_ED25519_PRIVATE_KEY` (giá trị khóa).
5. Dòng khóa cũ trong `.env.local`: vẫn chạy để chuyển tiếp, nhưng mỗi lần đều in cảnh báo.

Script từ chối tệp khóa nằm trong repo (kể cả đi vòng qua symlink hay junction). Tệp chứa một dòng base64, hoặc nguyên dòng `STRIDE_ED25519_PRIVATE_KEY=...` chép từ `.env.local` cũ.

**Cách dùng mặc định.** Thêm `--key-stdin` vào lệnh rồi dán khóa khi được hỏi (chữ không hiện):

```powershell
npm run keygen -- issue --id PL-<id đơn Polar> --region global-us --out PL.stride-license.json --key-stdin
npm run worker:secrets -- --key-only --key-stdin   # secret webhook nạp ở lượt riêng: npm run worker:secrets -- --webhook-only
```

**Nối ống từ trình quản lý mật khẩu thì gọi thẳng `node`, không qua `npm run`.** Trong PowerShell, khi có dữ liệu ống, `npm.ps1` làm rơi dấu `--` nên các cờ như `--key-stdin`, `--key-only` không tới được script (đã chạy thử 2026-11-19 trên PowerShell 5.1). `worker-secrets` tự dừng nếu stdin là ống mà thiếu `--key-only`, để secret webhook không bị nạp nhầm từ ống.

```powershell
<lệnh đọc khóa của trình quản lý mật khẩu> | node scripts/keygen.mjs issue --id PL-<id đơn Polar> --region global-us --out PL.stride-license.json --key-stdin
<lệnh đọc khóa của trình quản lý mật khẩu> | node scripts/worker-secrets.mjs --key-only --key-stdin
```

**Chuyển khóa ra khỏi `.env.local`** (founder làm một lần trên máy mình, PowerShell ở thư mục gốc repo, không lệnh nào in giá trị khóa):

```powershell
# 0. Chắc chắn trình quản lý mật khẩu đã có bản sao khóa (mục 4).
# 1. Kiểm bản trong trình quản lý mật khẩu: dán khóa khi được hỏi, phải thấy "Khớp (khóa đọc từ stdin)"
npm run keygen -- check --key-stdin
# 2. Chỉ khi bước 1 báo Khớp: bỏ dòng khóa khỏi .env.local (ghi lại UTF-8 không BOM, giữ nguyên các dòng khác)
$p = (Resolve-Path .env.local).Path
[System.IO.File]::WriteAllLines($p, [string[]]@([System.IO.File]::ReadAllLines($p) | Where-Object { $_ -notmatch '^STRIDE_ED25519_PRIVATE_KEY=' }))
# 3. Kiểm lại: lệnh không cờ phải báo "Chưa có khóa riêng", tức là trong repo không còn khóa
npm run keygen -- check
```

**Phương án dự phòng: tệp ngoài repo** (VD: cần ký nhiều lần liền nhau). Xóa tệp khi xong việc; bản lưu lâu dài vẫn là trình quản lý mật khẩu.

```powershell
# 1. Tạo tệp khóa ngoài repo từ dòng trong .env.local, chỉ tài khoản của mình được đọc
$keyFile = "$env:USERPROFILE\.stride\license-signing.key"
New-Item -ItemType Directory -Force (Split-Path $keyFile) | Out-Null
$lines = [System.IO.File]::ReadAllLines((Resolve-Path .env.local).Path)
[System.IO.File]::WriteAllLines($keyFile, [string[]]($lines | Where-Object { $_ -match '^STRIDE_ED25519_PRIVATE_KEY=' }))
icacls $keyFile /inheritance:r /grant:r "$($env:USERNAME):(R,W)" | Out-Null
# 2. Kiểm tra tệp mới: phải thấy "Khớp (khóa đọc từ tệp ngoài repo)"
npm run keygen -- check --key-file $keyFile
# 3. Chỉ khi bước 2 báo Khớp: bỏ dòng khóa khỏi .env.local, thay bằng dòng đường dẫn (ghi UTF-8 không BOM)
$kept = [string[]]($lines | Where-Object { $_ -notmatch '^STRIDE_ED25519_PRIVATE_KEY=' }) + "STRIDE_ED25519_PRIVATE_KEY_FILE=$keyFile"
[System.IO.File]::WriteAllLines((Resolve-Path .env.local).Path, $kept)
# 4. Kiểm tra lần cuối: "Khớp", không còn cảnh báo
npm run keygen -- check
```

Bước 1 của phương án dự phòng đọc dòng khóa từ `.env.local`, nên làm trước bước chuyển khóa ở trên; nếu `.env.local` đã sạch thì tạo tệp từ trình quản lý mật khẩu. Xong việc thì xóa `$keyFile` và dòng `STRIDE_ED25519_PRIVATE_KEY_FILE`, quay về cách mặc định.
