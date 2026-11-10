-- Kho đồng bộ mã hóa đầu-cuối: máy chủ chỉ lưu bản mã (không đọc được nội dung) + version cho khóa lạc quan.
CREATE TABLE IF NOT EXISTS vaults (
  id TEXT PRIMARY KEY,          -- SHA-256 của mã đồng bộ (64 hex), không suy ngược được ra mã
  version INTEGER NOT NULL,     -- tăng 1 mỗi lần ghi; PUT phải gửi đúng version hiện tại
  iv TEXT NOT NULL,             -- IV AES-GCM (base64)
  ciphertext TEXT NOT NULL,     -- dữ liệu đã nén + mã hóa (base64)
  size INTEGER NOT NULL,
  license_id TEXT,              -- licenseKeyOrAddonId của bản quyền tạo kho (giới hạn số kho / bản quyền)
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vaults_license ON vaults (license_id);

-- Bản ghi đơn đã thanh toán (token đã ký). Đặt ở D1 thay vì KV vì KV nhất quán sau và lưu đệm cả kết quả "chưa có"
-- tới 60 giây ở từng edge: app và trang chờ của Success URL hỏi trước khi webhook ghi nên bị kẹt ở "pending" (A11).
CREATE TABLE IF NOT EXISTS orders (
  record_key TEXT PRIMARY KEY,  -- order:<mã đơn của app> | plorder:<id đơn Polar> | lsorder:<id đơn LemonSqueezy>
  record TEXT NOT NULL,         -- JSON: token, channel, orderId, claimHash, createdAt
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL      -- hết hạn giữ (90 ngày, như TTL cũ của KV); đọc bỏ qua hàng đã hết hạn
);

-- Ánh xạ phiên checkout của Polar (Success URL mang checkout_id) sang bản ghi đơn
CREATE TABLE IF NOT EXISTS checkouts (
  checkout_id TEXT PRIMARY KEY,
  record_key TEXT NOT NULL,
  created_at TEXT NOT NULL
);
