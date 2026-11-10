import { APP_VERSION, COMPLETED_LOGS_KEY, STORAGE_KEY, STREAK_KEY } from '../constants';
import type { Project, StrideBackupPayload } from '../types';

/**
 * Sao lưu khẩn cấp cho màn hình lỗi: đọc thẳng localStorage, không phụ thuộc state React (có thể đã hỏng).
 * Khuôn ra trùng file "Xuất JSON" của app nên nhập lại được bằng chức năng Khôi phục.
 * Các tên khóa viết lặp ở đây (không import hook) để màn hình lỗi không kéo theo module có thể đang lỗi.
 */
const AUTO_BACKUP_KEY = 'STRIDE_AUTO_BACKUP_DATA';
const CUSTOM_STATUSES_KEY = 'STRIDE_CUSTOM_STATUSES_V1';
const LICENSE_KEY = 'STRIDE_PRO_LICENSE_V2';
const LOG_ARCHIVE_KEY = 'SOLO_COMPLETED_LOGS_ARCHIVE_V1';

type ReadableStorage = Pick<Storage, 'getItem'>;

function readJson(storage: ReadableStorage, key: string): unknown {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

const isProjectList = (value: unknown): value is Project[] =>
  Array.isArray(value) && value.every((p) => p && typeof p === 'object' && Array.isArray((p as Project).tasks));

export function buildEmergencyBackup(storage: ReadableStorage, now: Date = new Date()): StrideBackupPayload {
  const auto = readJson(storage, AUTO_BACKUP_KEY) as { projects?: unknown } | undefined;
  const stored = readJson(storage, STORAGE_KEY);
  const projects = isProjectList(stored) ? stored : isProjectList(auto?.projects) ? auto.projects : [];

  const logs = readJson(storage, COMPLETED_LOGS_KEY);
  const completedLogs = Array.isArray(logs) ? logs : [];
  const statuses = readJson(storage, CUSTOM_STATUSES_KEY);
  const archive = (readJson(storage, LOG_ARCHIVE_KEY) as { archivedDailyCounts?: unknown } | undefined)?.archivedDailyCounts;
  const streak = readJson(storage, STREAK_KEY);
  const license = readJson(storage, LICENSE_KEY);

  return {
    version: APP_VERSION,
    schemaVersion: 2,
    appName: 'Stride Tasks',
    exportedAt: now.toISOString(),
    summary: {
      projectCount: projects.length,
      taskCount: projects.reduce((sum, p) => sum + p.tasks.length, 0),
      historyLogCount: completedLogs.length,
    },
    data: {
      projects,
      completedLogs,
      ...(Array.isArray(statuses) ? { customStatuses: statuses } : {}),
      ...(archive && typeof archive === 'object' ? { completedLogsArchive: archive as Record<string, number> } : {}),
      ...(streak !== undefined ? { streak: streak as StrideBackupPayload['data']['streak'] } : {}),
      ...(license !== undefined ? { proLicense: license } : {}),
    },
  };
}

export function downloadEmergencyBackup(): void {
  const payload = buildEmergencyBackup(localStorage);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `stride-tasks-emergency-backup-${payload.exportedAt.slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
