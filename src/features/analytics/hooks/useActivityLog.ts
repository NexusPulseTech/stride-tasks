import { useState, useEffect, useCallback, useMemo } from 'react';
import { COMPLETED_LOGS_KEY } from '../../../constants';
import { CompletedItemLog } from '../../../types';

export type { CompletedItemLog } from '../../../types';

export function getTodayKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateToKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLevelFromCount(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 2) return 2;
  if (count === 3) return 3;
  return 4; // 4+ tasks
}

function generateInitialSeedLogs(): CompletedItemLog[] {
  const today = new Date();
  const seedTemplate = [
    // Hôm nay (2 việc)
    { daysAgo: 0, time: '14:30', title: 'Mua tên miền & cấu hình hosting https://cloudflare.com', proj: 'Làm Game Kiếm Tiền YouTube', projId: 'p1', subsDone: 2, subsTotal: 2 },
    { daysAgo: 0, time: '10:15', title: 'Khảo sát chỉ số người chơi trên SteamDB https://steamdb.info', proj: 'Làm Game Kiếm Tiền YouTube', projId: 'p1', subsDone: 0, subsTotal: 0 },
    // Hôm qua (2 việc)
    { daysAgo: 1, time: '16:45', title: 'Lên 10 kịch bản video ngắn dạng checklist', proj: 'Kênh TikTok triệu view', projId: 'p2', subsDone: 0, subsTotal: 0 },
    { daysAgo: 1, time: '09:20', title: 'Xem 10 video phân tích gameplay thành công https://youtube.com', proj: 'Làm Game Kiếm Tiền YouTube', projId: 'p1', subsDone: 0, subsTotal: 0 },
    // 2 ngày trước (1 việc)
    { daysAgo: 2, time: '15:10', title: 'Chốt tài liệu thiết kế game 1 trang (GDD)', proj: 'Làm Game Kiếm Tiền YouTube', projId: 'p1', subsDone: 0, subsTotal: 0 },
    // 3 ngày trước (2 việc)
    { daysAgo: 3, time: '17:30', title: 'Chuẩn bị danh sách hashtag thịnh hành TikTok', proj: 'Kênh TikTok triệu view', projId: 'p2', subsDone: 0, subsTotal: 0 },
    { daysAgo: 3, time: '11:00', title: 'Cài đặt môi trường Node.js & Vite 6', proj: 'Làm Game Kiếm Tiền YouTube', projId: 'p1', subsDone: 0, subsTotal: 0 },
    // 4 ngày trước (1 việc)
    { daysAgo: 4, time: '14:00', title: 'Thiết kế bố cục wireframe giao diện trên giấy', proj: 'Làm Game Kiếm Tiền YouTube', projId: 'p1', subsDone: 0, subsTotal: 0 },
    // 5 ngày trước (2 việc)
    { daysAgo: 5, time: '16:20', title: 'Đăng ký tài khoản Google AI Studio & cấu hình API', proj: 'Làm Game Kiếm Tiền YouTube', projId: 'p1', subsDone: 0, subsTotal: 0 },
    { daysAgo: 5, time: '10:40', title: 'Khảo sát 15 kênh đối thủ cùng chủ đề', proj: 'Kênh TikTok triệu view', projId: 'p2', subsDone: 0, subsTotal: 0 },
    // 6 ngày trước (2 việc)
    { daysAgo: 6, time: '15:50', title: 'Viết kịch bản mẫu cho video đầu tiên', proj: 'Kênh TikTok triệu view', projId: 'p2', subsDone: 0, subsTotal: 0 },
    { daysAgo: 6, time: '09:30', title: 'Cấu hình Git repository & branch protection', proj: 'Làm Game Kiếm Tiền YouTube', projId: 'p1', subsDone: 0, subsTotal: 0 },
    // 8 ngày trước (1 việc)
    { daysAgo: 8, time: '14:15', title: 'Thiết lập profile cá nhân & bio TikTok', proj: 'Kênh TikTok triệu view', projId: 'p2', subsDone: 0, subsTotal: 0 },
    // 9 ngày trước (2 việc)
    { daysAgo: 9, time: '16:00', title: 'Thu âm thử nghiệm 3 đoạn audio voiceover', proj: 'Kênh TikTok triệu view', projId: 'p2', subsDone: 0, subsTotal: 0 },
    { daysAgo: 9, time: '11:20', title: 'Tìm kiếm kho nhạc nền bản quyền YouTube Studio', proj: 'Làm Game Kiếm Tiền YouTube', projId: 'p1', subsDone: 0, subsTotal: 0 },
    // 11 ngày trước (1 việc)
    { daysAgo: 11, time: '15:00', title: 'Lập kế hoạch phân bổ thời gian 2 giờ/ngày', proj: 'Làm Game Kiếm Tiền YouTube', projId: 'p1', subsDone: 0, subsTotal: 0 },
    // 12 ngày trước (1 việc)
    { daysAgo: 12, time: '10:30', title: 'Tìm hiểu cơ chế thuật toán TikTok recommendation', proj: 'Kênh TikTok triệu view', projId: 'p2', subsDone: 0, subsTotal: 0 },
    // 13 ngày trước (2 việc)
    { daysAgo: 13, time: '14:40', title: 'Chuẩn bị thư mục tài nguyên âm thanh & sprite 2D', proj: 'Làm Game Kiếm Tiền YouTube', projId: 'p1', subsDone: 0, subsTotal: 0 },
    { daysAgo: 13, time: '09:15', title: 'Thiết kế logo kênh tối giản bằng Figma', proj: 'Kênh TikTok triệu view', projId: 'p2', subsDone: 0, subsTotal: 0 },
  ];

  return seedTemplate.map((item, index) => {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - item.daysAgo);
    const [hh, mm] = item.time.split(':');
    targetDate.setHours(parseInt(hh, 10), parseInt(mm, 10), 0, 0);

    return {
      id: `clog_seed_${index}_${item.daysAgo}`,
      taskId: `t_seed_${index}`,
      taskTitle: item.title,
      projectId: item.projId,
      projectName: item.proj,
      completedAt: targetDate.toISOString(),
      dateKey: formatDateToKey(targetDate),
      subtasksCompleted: item.subsDone,
      subtasksTotal: item.subsTotal,
    };
  });
}

export function useActivityLog() {
  const [completedLogs, setCompletedLogs] = useState<CompletedItemLog[]>(() => {
    try {
      const stored = localStorage.getItem(COMPLETED_LOGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}

    const initial = generateInitialSeedLogs();
    try {
      localStorage.setItem(COMPLETED_LOGS_KEY, JSON.stringify(initial));
    } catch (e) {}
    return initial;
  });

  const saveLogs = useCallback((newLogs: CompletedItemLog[]) => {
    setCompletedLogs(newLogs);
    try {
      localStorage.setItem(COMPLETED_LOGS_KEY, JSON.stringify(newLogs));
    } catch (e) {}
  }, []);

  // Ghi nhận hoàn thành công việc (SSOT: Thêm log hoàn thành thực tế)
  const recordTaskCompletion = useCallback(
    (
      task: { id: string; title: string; subtasks?: any[] },
      project?: { id: string; name: string }
    ) => {
      const now = new Date();
      const dateKey = formatDateToKey(now);
      const subs = task.subtasks || [];
      const subsDone = subs.filter((s: any) => s.completed).length;

      const newEntry: CompletedItemLog = {
        id: `clog_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        taskId: task.id,
        taskTitle: task.title,
        projectId: project?.id || 'default',
        projectName: project?.name || 'Chung',
        completedAt: now.toISOString(),
        dateKey,
        subtasksCompleted: subsDone,
        subtasksTotal: subs.length,
      };

      setCompletedLogs((prev) => {
        // Tránh trùng lặp nếu task này đã vừa được đánh dấu done hôm nay
        const filtered = prev.filter(
          (item) => !(item.taskId === task.id && item.dateKey === dateKey)
        );
        const updated = [newEntry, ...filtered];
        try {
          localStorage.setItem(COMPLETED_LOGS_KEY, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    },
    []
  );

  // Xóa log khi người dùng bỏ tick hoàn thành (Uncheck)
  const removeTaskCompletion = useCallback((taskId: string) => {
    setCompletedLogs((prev) => {
      // Xóa log gần nhất của task này
      const index = prev.findIndex((item) => item.taskId === taskId);
      if (index === -1) return prev;
      const updated = [...prev];
      updated.splice(index, 1);
      try {
        localStorage.setItem(COMPLETED_LOGS_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  // Xóa một dòng log cụ thể khỏi lịch sử hoàn thành
  const deleteActivityLog = useCallback((logId: string) => {
    setCompletedLogs((prev) => {
      const updated = prev.filter((item) => item.id !== logId);
      try {
        localStorage.setItem(COMPLETED_LOGS_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  // Xóa sạch toàn bộ lịch sử hoàn thành (Clear all logs)
  const clearAllActivityLogs = useCallback(() => {
    setCompletedLogs([]);
    try {
      localStorage.setItem(COMPLETED_LOGS_KEY, JSON.stringify([]));
    } catch (e) {}
  }, []);

  // Khôi phục lại dữ liệu mẫu nếu cần
  const resetSeedActivityLogs = useCallback(() => {
    const seed = generateInitialSeedLogs();
    setCompletedLogs(seed);
    try {
      localStorage.setItem(COMPLETED_LOGS_KEY, JSON.stringify(seed));
    } catch (e) {}
  }, []);

  // Tính toán bản đồ nhịp độ (Heatmap Map) trực tiếp từ danh sách log hoàn thành thực tế
  const activityMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const log of completedLogs) {
      map[log.dateKey] = (map[log.dateKey] || 0) + 1;
    }
    return map;
  }, [completedLogs]);

  // Hôm nay: số việc đã xong đúng ngày hôm nay
  const todayKey = getTodayKey();
  const todayCount = useMemo(() => {
    return completedLogs.filter((item) => item.dateKey === todayKey).length;
  }, [completedLogs, todayKey]);

  // Tuần này: số việc đã xong từ Thứ Hai của tuần hiện tại
  const weekCount = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = CN, 1 = T2
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    return completedLogs.filter(
      (item) => new Date(item.completedAt).getTime() >= startOfWeek.getTime()
    ).length;
  }, [completedLogs]);

  // Chuỗi ngày liên tục (Streak): Đếm các ngày liên tiếp lùi từ hôm nay
  const currentStreak = useMemo(() => {
    let streak = 0;
    const d = new Date();
    const checkMap = activityMap;

    while (true) {
      const key = formatDateToKey(d);
      if ((checkMap[key] || 0) > 0) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        // Nếu hôm nay chưa làm việc nào, kiểm tra từ hôm qua
        if (streak === 0 && key === todayKey) {
          d.setDate(d.getDate() - 1);
          continue;
        }
        break;
      }
    }
    return streak;
  }, [activityMap, todayKey]);

  // Tổng số việc đã xong
  const totalCompleted = completedLogs.length;

  return {
    completedLogs,
    activityMap,
    todayCount,
    weekCount,
    currentStreak,
    totalCompleted,
    recordTaskCompletion,
    removeTaskCompletion,
    deleteActivityLog,
    clearAllActivityLogs,
    resetSeedActivityLogs,
    saveLogs,
  };
}
