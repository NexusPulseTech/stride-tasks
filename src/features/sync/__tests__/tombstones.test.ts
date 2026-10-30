import { describe, expect, it } from 'vitest';
import { mergeTombstones, pruneTombstones } from '../tombstones';

const NOW = new Date('2026-10-28T12:00:00.000Z');
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000).toISOString();

describe('pruneTombstones', () => {
  it('dọn tombstone cũ hơn 90 ngày, giữ cái từ 90 ngày trở lại', () => {
    const pruned = pruneTombstones({ 't:old': daysAgo(91), 't:edge': daysAgo(89), 't:new': daysAgo(1) }, NOW);
    expect(Object.keys(pruned).sort()).toEqual(['t:edge', 't:new']);
  });
});

describe('mergeTombstones', () => {
  it('giữ đủ khóa của hai bên, khóa trùng lấy thời điểm xóa muộn hơn', () => {
    const merged = mergeTombstones({ 't:a': daysAgo(5), 't:b': daysAgo(3) }, { 't:b': daysAgo(1), 'p:c': daysAgo(2) });
    expect(merged).toEqual({ 't:a': daysAgo(5), 't:b': daysAgo(1), 'p:c': daysAgo(2) });
  });
});
