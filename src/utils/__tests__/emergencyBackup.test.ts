import { describe, expect, it } from 'vitest';
import { buildEmergencyBackup } from '../emergencyBackup';

const storage = (entries: Record<string, unknown>) => ({
  getItem: (key: string) => (key in entries ? (typeof entries[key] === 'string' ? (entries[key] as string) : JSON.stringify(entries[key])) : null),
});

const project = (id: string, tasks = 2) => ({ id, name: id, isExpanded: true, tasks: Array.from({ length: tasks }, (_, i) => ({ id: `${id}-${i}`, title: 't', status: 'todo', subtasks: [] })) });
const NOW = new Date('2026-11-10T08:00:00.000Z');

describe('buildEmergencyBackup', () => {
  it('ra đúng khuôn mà bộ nhập của app đọc được (data.projects, data.completedLogs)', () => {
    const backup = buildEmergencyBackup(
      storage({
        SOLO_CORE_TASKS_V4: [project('p1', 3), project('p2', 1)],
        SOLO_COMPLETED_LOGS_V2: [{ id: 'l1' }],
        STRIDE_CUSTOM_STATUSES_V1: [{ id: 'review', label: 'Review', category: 'doing', color: '#000' }],
        STRIDE_PRO_LICENSE_V2: { token: 'STRIDE1.x.y' },
      }),
      NOW
    );
    expect(backup.appName).toBe('Stride Tasks');
    expect(backup.exportedAt).toBe(NOW.toISOString());
    expect(backup.data.projects.map((p) => p.id)).toEqual(['p1', 'p2']);
    expect(backup.summary).toEqual({ projectCount: 2, taskCount: 4, historyLogCount: 1 });
    expect(backup.data.customStatuses).toHaveLength(1);
    expect(backup.data.proLicense).toEqual({ token: 'STRIDE1.x.y' });
  });

  it('dữ liệu chính hỏng thì lấy dự án từ bản tự sao lưu', () => {
    const backup = buildEmergencyBackup(storage({ SOLO_CORE_TASKS_V4: '{not json', STRIDE_AUTO_BACKUP_DATA: { projects: [project('auto')] } }), NOW);
    expect(backup.data.projects.map((p) => p.id)).toEqual(['auto']);
  });

  it('bộ nhớ trống hoặc hỏng hết vẫn trả về file hợp lệ, không ném lỗi', () => {
    const backup = buildEmergencyBackup(storage({ SOLO_CORE_TASKS_V4: '[{"bad":1}]', SOLO_COMPLETED_LOGS_V2: '"oops"' }), NOW);
    expect(backup.data.projects).toEqual([]);
    expect(backup.data.completedLogs).toEqual([]);
    expect(backup.data.proLicense).toBeUndefined();
  });
});
