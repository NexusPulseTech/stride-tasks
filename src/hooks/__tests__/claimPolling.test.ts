import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { generateClaimSecret, nextClaimDelay, sha256Hex } from '../claimPolling';

// Mô phỏng một tab mở liên tục: hỏi ngay lúc 0, sau đó theo nextClaimDelay cho tới khi dừng
function requestsPerWindow(): number {
  let elapsed = 0;
  let requests = 0;
  for (;;) {
    requests++;
    const delay = nextClaimDelay(elapsed);
    if (delay === null) return requests;
    elapsed += delay;
  }
}

describe('nextClaimDelay', () => {
  it('hỏi mỗi 6 giây trong 5 phút đầu', () => {
    expect(nextClaimDelay(0)).toBe(6_000);
    expect(nextClaimDelay(299_999)).toBe(6_000);
  });

  it('hỏi mỗi 60 giây từ phút 5 tới phút 30', () => {
    expect(nextClaimDelay(300_000)).toBe(60_000);
    expect(nextClaimDelay(1_799_999)).toBe(60_000);
  });

  it('dừng hẳn sau 30 phút', () => {
    expect(nextClaimDelay(1_800_000)).toBeNull();
  });

  it('một cửa sổ hỏi dưới 100 request (trước đây tab mở 72 giờ gửi khoảng 43.200)', () => {
    expect(requestsPerWindow()).toBeLessThan(100);
  });
});

describe('claim secret', () => {
  it('là 128 bit dạng 32 ký tự hex, khác nhau mỗi lần', () => {
    const secret = generateClaimSecret();
    expect(secret).toMatch(/^[0-9a-f]{32}$/);
    expect(generateClaimSecret()).not.toBe(secret);
  });

  it('sha256Hex khớp node:crypto (Worker so băm này với bản đã đăng ký)', async () => {
    const secret = generateClaimSecret();
    expect(await sha256Hex(secret)).toBe(createHash('sha256').update(secret).digest('hex'));
  });
});
