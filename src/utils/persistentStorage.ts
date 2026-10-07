import { Project } from '../types';
import { STORAGE_KEY, INITIAL_PROJECTS } from '../constants';

export const STRIDE_SNAPSHOT_VAULT_KEY = 'STRIDE_SNAPSHOT_VAULT_V1';
export const STRIDE_AUTO_BACKUP_KEY = 'STRIDE_AUTO_BACKUP_DATA';
export const STRIDE_EMERGENCY_RECOVERY_KEY = 'STRIDE_EMERGENCY_RECOVERY_DATA';
export const HAS_INITIALIZED_KEY = 'SOLO_CORE_INITIALIZED_V4';

export const ALL_RECOVERY_STORAGE_KEYS = [
  STORAGE_KEY,
  STRIDE_EMERGENCY_RECOVERY_KEY,
  STRIDE_AUTO_BACKUP_KEY,
  'SOLO_CORE_TASKS_V4',
  'SOLO_CORE_TASKS_V3',
  'SOLO_CORE_TASKS_V2',
  'SOLO_CORE_TASKS_V1',
  'STRIDE_TASKS',
  'stride_projects',
  'task_manager_projects',
  'tasks_data',
  'tasktodo_data',
  'app_projects',
];

export interface SnapshotItem {
  id: string;
  timestamp: string;
  projectCount: number;
  taskCount: number;
  projects: Project[];
  label?: string;
}

export interface DiscoveredRecoverySource {
  key: string;
  label: string;
  timestamp: string;
  projectCount: number;
  taskCount: number;
  projects: Project[];
}

// ----------------------------------------------------
// 1. Native IndexedDB Engine (Zero-Dependency)
// ----------------------------------------------------
const IDB_NAME = 'NexusPulseTasksDB';
const IDB_STORE = 'app_state';
const IDB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

export async function idbSet<T>(key: string, value: T): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.put(value, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (e) {
    return false;
  }
}

// ----------------------------------------------------
// 2. Request Persistent Storage (Tránh browser tự ý xóa cache)
// ----------------------------------------------------
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      return await navigator.storage.persist();
    } catch (e) {
      return false;
    }
  }
  return false;
}

// ----------------------------------------------------
// 3. Helper đếm số lượng task thực tế
// ----------------------------------------------------
export function countTotalTasks(projects: Project[]): number {
  if (!Array.isArray(projects)) return 0;
  return projects.reduce((total, p) => total + (Array.isArray(p.tasks) ? p.tasks.length : 0), 0);
}

// CHỈ COI LÀ TEMPLATE KHI GIỐNG 100% INITIAL_PROJECTS
// Bất kỳ chỉnh sửa nào (thêm/sửa/xóa task) đều là dữ liệu thật của người dùng!
export function isSampleTemplate(projects: Project[]): boolean {
  if (!Array.isArray(projects) || projects.length === 0) return false;
  try {
    return JSON.stringify(projects) === JSON.stringify(INITIAL_PROJECTS);
  } catch (e) {
    return false;
  }
}

// ----------------------------------------------------
// 4. Quét & Tìm Kiếm Dữ Liệu Từ MỌI Nguồn Cũ (Anti-Wipe Recovery)
// ----------------------------------------------------
export function scanLegacyData(): Project[] | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;

  let bestCandidate: Project[] | null = null;
  let maxTasks = 0;

  for (const key of ALL_RECOVERY_STORAGE_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      // Trường hợp 1: Dạng Auto-Backup { projects: [...] }
      if (parsed && Array.isArray(parsed.projects) && parsed.projects.length > 0) {
        const count = countTotalTasks(parsed.projects);
        if (count > maxTasks && !isSampleTemplate(parsed.projects)) {
          bestCandidate = parsed.projects;
          maxTasks = count;
        }
      }
      // Trường hợp 2: Dạng mảng trực tiếp Project[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        const count = countTotalTasks(parsed);
        if (count > maxTasks && !isSampleTemplate(parsed)) {
          bestCandidate = parsed;
          maxTasks = count;
        }
      }
    } catch (e) {}
  }

  // Trường hợp 3: Quét Snapshot Vault nếu có
  if (!bestCandidate) {
    try {
      const vault = getSnapshotVault();
      if (vault.length > 0 && vault[0].projects && Array.isArray(vault[0].projects)) {
        bestCandidate = vault[0].projects;
      }
    } catch (e) {}
  }

  return bestCandidate;
}

// ----------------------------------------------------
// 5. Deep Scan Tất Cả Nguồn Phục Hồi Cho Người Dùng Chọn (Emergency Rescue)
// ----------------------------------------------------
export function deepScanAllRecoverySources(): DiscoveredRecoverySource[] {
  const sources: DiscoveredRecoverySource[] = [];
  if (typeof window === 'undefined' || !window.localStorage) return sources;

  for (const key of ALL_RECOVERY_STORAGE_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);

      let targetProjects: Project[] | null = null;
      let timestamp = new Date().toISOString();

      if (parsed && Array.isArray(parsed.projects) && parsed.projects.length > 0) {
        targetProjects = parsed.projects;
        if (parsed.timestamp) timestamp = parsed.timestamp;
      } else if (Array.isArray(parsed) && parsed.length > 0) {
        targetProjects = parsed;
      }

      if (targetProjects && targetProjects.length > 0) {
        const count = countTotalTasks(targetProjects);
        sources.push({
          key,
          label: key === STORAGE_KEY ? 'Khóa hiện tại (Storage)' : key === STRIDE_EMERGENCY_RECOVERY_KEY ? 'Dự phòng khẩn cấp' : key === STRIDE_AUTO_BACKUP_KEY ? 'Bản sao lưu tự động' : `Khóa cũ: ${key}`,
          timestamp,
          projectCount: targetProjects.length,
          taskCount: count,
          projects: targetProjects,
        });
      }
    } catch (e) {}
  }

  // Snapshot Vault
  try {
    const vault = getSnapshotVault();
    vault.forEach((snap, idx) => {
      sources.push({
        key: `vault_${snap.id || idx}`,
        label: `Snapshot #${idx + 1} (${snap.label || 'Tự động'})`,
        timestamp: snap.timestamp,
        projectCount: snap.projectCount || snap.projects.length,
        taskCount: snap.taskCount || countTotalTasks(snap.projects),
        projects: snap.projects,
      });
    });
  } catch (e) {}

  return sources;
}

// ----------------------------------------------------
// 6. Khởi tạo dữ liệu an toàn tuyệt đối (Safe Load)
// ----------------------------------------------------
export function loadProjectsSafely(): Project[] {
  if (typeof window === 'undefined') return INITIAL_PROJECTS;

  try {
    const primary = localStorage.getItem(STORAGE_KEY);
    const hasInitialized = localStorage.getItem(HAS_INITIALIZED_KEY);

    // 1. Thử load từ key chính hiện tại
    if (primary !== null) {
      try {
        const parsed = JSON.parse(primary);
        // Nếu primary là mảng (kể cả mảng rỗng [] khi người dùng xóa hết dự án)
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (err) {}
    }

    // 2. Nếu người dùng đã từng khởi tạo nhưng key STORAGE_KEY bị thiếu
    if (hasInitialized === 'true') {
      return [];
    }

    // 3. Nếu là thiết bị hoàn toàn mới, quét các bản sao lưu cũ & phục hồi
    const recovered = scanLegacyData();
    if (recovered && recovered.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recovered));
        localStorage.setItem(HAS_INITIALIZED_KEY, 'true');
        idbSet(STORAGE_KEY, recovered);
        idbSet(HAS_INITIALIZED_KEY, true);
      } catch (e) {}
      return recovered;
    }

    // 4. Nếu chưa từng có dữ liệu: nạp dữ liệu mẫu ban đầu
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PROJECTS));
      localStorage.setItem(HAS_INITIALIZED_KEY, 'true');
      idbSet(STORAGE_KEY, INITIAL_PROJECTS);
      idbSet(HAS_INITIALIZED_KEY, true);
    } catch (e) {}
    return INITIAL_PROJECTS;
  } catch (e) {
    console.error('Error in loadProjectsSafely:', e);
    return INITIAL_PROJECTS;
  }
}

// ----------------------------------------------------
// 7. Snapshot Vault: Giữ lại 20 bản sao lưu xoay vòng
// ----------------------------------------------------
export function saveSnapshotToVault(projects: Project[], label?: string): void {
  if (typeof window === 'undefined' || !Array.isArray(projects) || projects.length === 0) return;
  if (isSampleTemplate(projects)) return; // Không lưu snapshot của dữ liệu mẫu ban đầu

  try {
    const raw = localStorage.getItem(STRIDE_SNAPSHOT_VAULT_KEY);
    let vault: SnapshotItem[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(vault)) vault = [];

    const newSnapshot: SnapshotItem = {
      id: `snap_${Date.now()}`,
      timestamp: new Date().toISOString(),
      projectCount: projects.length,
      taskCount: countTotalTasks(projects),
      projects,
      label: label || 'Tự động sao lưu',
    };

    // Kiểm tra trùng lặp với snapshot mới nhất
    if (vault.length > 0) {
      const latest = vault[0];
      if (latest.taskCount === newSnapshot.taskCount && JSON.stringify(latest.projects) === JSON.stringify(newSnapshot.projects)) {
        return;
      }
    }

    vault.unshift(newSnapshot);
    if (vault.length > 20) {
      vault = vault.slice(0, 20); // Giữ 20 bản gần nhất
    }

    localStorage.setItem(STRIDE_SNAPSHOT_VAULT_KEY, JSON.stringify(vault));
    // Lưu song song vào IndexedDB
    idbSet(STRIDE_SNAPSHOT_VAULT_KEY, vault);
  } catch (e) {}
}

export function getSnapshotVault(): SnapshotItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STRIDE_SNAPSHOT_VAULT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

// ----------------------------------------------------
// 8. Cross-Tab Realtime Synchronization (BroadcastChannel)
// ----------------------------------------------------
let syncChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    syncChannel = new BroadcastChannel('stride_task_sync_channel');
  }
} catch (e) {}

export function broadcastDataUpdate(projects: Project[]): void {
  try {
    if (syncChannel) {
      syncChannel.postMessage({ type: 'PROJECTS_UPDATED', timestamp: Date.now() });
    }
  } catch (e) {}
}

export function subscribeCrossTabSync(onRemoteUpdate: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleBroadcast = (event: MessageEvent) => {
    if (event.data && event.data.type === 'PROJECTS_UPDATED') {
      onRemoteUpdate();
    }
  };

  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      onRemoteUpdate();
    }
  };

  if (syncChannel) {
    syncChannel.addEventListener('message', handleBroadcast);
  }
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    if (syncChannel) {
      syncChannel.removeEventListener('message', handleBroadcast);
    }
    window.removeEventListener('storage', handleStorageEvent);
  };
}

// ----------------------------------------------------
// 9. Ghi đè an toàn (Anti-Wipe Guard with Quota Pruning)
// ----------------------------------------------------
function safeLocalStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e: any) {
    // Nếu gặp QuotaExceededError, dọn dẹp các snapshot cũ trong vault rồi thử lại
    if (e && (e.name === 'QuotaExceededError' || e.code === 22)) {
      try {
        const vault = getSnapshotVault();
        if (vault.length > 5) {
          const trimmed = vault.slice(0, 5);
          localStorage.setItem(STRIDE_SNAPSHOT_VAULT_KEY, JSON.stringify(trimmed));
          localStorage.setItem(key, value);
        }
      } catch (err) {}
    }
  }
}

export function saveProjectsSafely(projects: Project[], broadcast: boolean = true): void {
  if (typeof window === 'undefined' || !Array.isArray(projects)) return;

  try {
    const serialized = JSON.stringify(projects);

    // 1. Lưu vào LocalStorage chính và đánh dấu đã khởi tạo
    safeLocalStorageSet(STORAGE_KEY, serialized);
    safeLocalStorageSet(HAS_INITIALIZED_KEY, 'true');

    // 2. Đồng bộ song song vào IndexedDB vĩnh cửu
    idbSet(STORAGE_KEY, projects);
    idbSet(HAS_INITIALIZED_KEY, true);

    // 3. Quản lý dự phòng khẩn cấp
    if (!isSampleTemplate(projects) && projects.length > 0) {
      safeLocalStorageSet(STRIDE_EMERGENCY_RECOVERY_KEY, serialized);
      saveSnapshotToVault(projects);
    } else if (projects.length === 0) {
      // Khi người dùng cố tình xóa sạch dự án, dọn dẹp emergency recovery để tránh quét ngược
      try {
        localStorage.removeItem(STRIDE_EMERGENCY_RECOVERY_KEY);
      } catch (e) {}
    }

    // 4. Đồng bộ đa tab
    if (broadcast) {
      broadcastDataUpdate(projects);
    }
  } catch (e) {}
}

export function clearAllPersistentData(): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(HAS_INITIALIZED_KEY, 'true');
    localStorage.removeItem(STRIDE_EMERGENCY_RECOVERY_KEY);
    idbSet(STORAGE_KEY, []);
    idbSet(HAS_INITIALIZED_KEY, true);
    broadcastDataUpdate([]);
  } catch (e) {}
}
