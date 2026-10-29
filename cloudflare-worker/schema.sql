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
