import { useState, useEffect, useRef, useCallback } from 'react';
import { Project } from '../../../types';
import { playChime } from '../../../utils';

export type ReminderIntervalMinutes = 15 | 30 | 60;

const REMINDER_KEY = 'stride_tasks_reminder_enabled';
const REMINDER_INTERVAL_KEY = 'stride_tasks_reminder_interval';

interface UseSmartReminderProps {
  projects: Project[];
  isMuted: boolean;
  showToast: (msg: string) => void;
}

export function useSmartReminder({ projects, isMuted, showToast }: UseSmartReminderProps) {
  // Mặc định BẬT (true) vì mọi task chưa hoàn thành đều cần được nhắc cho đến khi Done
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(REMINDER_KEY);
      if (saved === 'false') return false;
      return true;
    } catch (e) {
      return true;
    }
  });

  const [intervalMinutes, setIntervalMinutes] = useState<ReminderIntervalMinutes>(() => {
    try {
      const v = Number(localStorage.getItem(REMINDER_INTERVAL_KEY));
      if (v === 15 || v === 30 || v === 60) return v;
    } catch (e) {}
    return 30;
  });

  // In-app Ambient Reminder Banner state
  const [inAppBanner, setInAppBanner] = useState<{
    visible: boolean;
    pendingCount: number;
    topTaskTitle: string;
    projectId?: string;
    taskId?: string;
  } | null>(null);

  const bannerTimerRef = useRef<number | null>(null);
  const notifiedReminderIdsRef = useRef<Set<string>>(new Set());
  const projectsRef = useRef(projects);
  projectsRef.current = projects;
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  const updateInterval = useCallback((mins: ReminderIntervalMinutes) => {
    setIntervalMinutes(mins);
    try {
      localStorage.setItem(REMINDER_INTERVAL_KEY, String(mins));
    } catch (e) {}
  }, []);

  // 1. Kiểm tra chính xác các công việc có lịch hẹn cụ thể (task.reminderAt hoặc hết hạn snoozeUntil)
  const checkScheduledReminders = useCallback(() => {
    const currentProjects = projectsRef.current;
    const now = Date.now();

    for (const p of currentProjects) {
      for (const t of p.tasks) {
        if (t.status === 'done') continue;
        const targetTimeStr = t.reminderAt || t.snoozeUntil;
        if (!targetTimeStr) continue;
        const reminderTime = new Date(targetTimeStr).getTime();
        if (isNaN(reminderTime)) continue;

        // Nếu đã đến giờ (hoặc vừa qua trong vòng 15 phút) và chưa bắn thông báo đợt này
        const isDue = reminderTime <= now && now - reminderTime <= 15 * 60 * 1000;
        const key = `${t.id}_${targetTimeStr}`;

        if (isDue && !notifiedReminderIdsRef.current.has(key)) {
          notifiedReminderIdsRef.current.add(key);
          playChime(isMutedRef.current);

          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`Đến giờ làm: ${t.title}`, {
                body: `Thuộc danh mục "${p.name}". Bấm vào ứng dụng để thực hiện ngay!`,
                icon: '/icon-192.png',
              });
            } catch (e) {}
          }

          setInAppBanner({
            visible: true,
            pendingCount: 1,
            topTaskTitle: t.title,
            projectId: p.id,
            taskId: t.id,
          });

          if (bannerTimerRef.current) window.clearTimeout(bannerTimerRef.current);
          bannerTimerRef.current = window.setTimeout(() => {
            setInAppBanner((prev) => (prev ? { ...prev, visible: false } : null));
          }, 12000);
          return;
        }
      }
    }
  }, []);

  // 2. Nhắc nhở định kỳ tổng quát khi có việc chưa hoàn thành & không đang trong kỳ hoãn cấp số nhân
  const triggerReminderCheck = useCallback(() => {
    const currentProjects = projectsRef.current;
    const now = Date.now();

    const activePendingList: { task: Project['tasks'][number]; projectId: string }[] = [];
    for (const p of currentProjects) {
      for (const t of p.tasks) {
        if (t.status === 'done') continue;
        // Nếu đang trong thời gian hoãn cấp số nhân Anki SRS (snoozeUntil > now) thì chưa làm phiền
        if (t.snoozeUntil) {
          const snoozeMs = new Date(t.snoozeUntil).getTime();
          if (!isNaN(snoozeMs) && snoozeMs > now) continue;
        }
        activePendingList.push({ task: t, projectId: p.id });
      }
    }

    if (activePendingList.length === 0) {
      setInAppBanner(null);
      return;
    }

    // Ưu tiên: Việc hết hạn hoãn / có lịch hẹn hôm nay > Việc được ghim > Việc đang làm > Việc đầu tiên
    const topEntry =
      activePendingList.find(({ task: t }) => {
        if (t.snoozeUntil) {
          const s = new Date(t.snoozeUntil).getTime();
          if (!isNaN(s) && s <= now) return true;
        }
        if (!t.reminderAt) return false;
        const d = new Date(t.reminderAt).getTime();
        return !isNaN(d) && d <= now + 2 * 60 * 60 * 1000;
      }) ||
      activePendingList.find(({ task: t }) => t.isPinned) ||
      activePendingList.find(({ task: t }) => t.status === 'doing') ||
      activePendingList[0];

    const topTask = topEntry.task;

    playChime(isMutedRef.current);

    // Gửi Web Notification hệ thống (nếu được cấp quyền)
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Stride Tasks - Nhắc việc thông minh', {
          body: `Bạn còn ${activePendingList.length} công việc cần xử lý! Ưu tiên: "${topTask.title.slice(0, 40)}"`,
          icon: '/icon-192.png',
        });
      } catch (e) {}
    }

    // Hiển thị In-App Banner tinh tế nếu tab đang active
    setInAppBanner({
      visible: true,
      pendingCount: activePendingList.length,
      topTaskTitle: topTask.title,
      projectId: topEntry.projectId,
      taskId: topTask.id,
    });

    if (bannerTimerRef.current) window.clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = window.setTimeout(() => {
      setInAppBanner((prev) => (prev ? { ...prev, visible: false } : null));
    }, 10000);
  }, []);

  const toggleReminder = useCallback(async () => {
    if (!reminderEnabled) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        try {
          const perm = await Notification.requestPermission();
          if (perm === 'granted') {
            setReminderEnabled(true);
            try {
              localStorage.setItem(REMINDER_KEY, 'true');
            } catch (e) {}
            showToastRef.current('Đã kích hoạt nhắc việc định kỳ!');
            triggerReminderCheck();
            return;
          }
        } catch (e) {}
      }
      // Vẫn bật được nhắc nhở dạng In-App Banner nếu web notification bị chặn
      setReminderEnabled(true);
      try {
        localStorage.setItem(REMINDER_KEY, 'true');
      } catch (e) {}
      showToastRef.current('Đã bật nhắc nhở công việc (thông báo trong app)!');
      triggerReminderCheck();
    } else {
      setReminderEnabled(false);
      try {
        localStorage.setItem(REMINDER_KEY, 'false');
      } catch (e) {}
      setInAppBanner(null);
      showToastRef.current('Đã tắt nhắc nhở công việc');
    }
  }, [reminderEnabled, triggerReminderCheck]);

  // Bộ định thời kiểm tra lịch hẹn cụ thể mỗi 30 giây (kể cả khi không bật nhắc định kỳ)
  useEffect(() => {
    checkScheduledReminders();
    const scheduleInterval = window.setInterval(checkScheduledReminders, 30 * 1000);
    return () => window.clearInterval(scheduleInterval);
  }, [checkScheduledReminders]);

  // Bộ định thời chạy chu kỳ nhắc nhở tổng quát
  useEffect(() => {
    if (!reminderEnabled) return;

    // Check ngay sau 5s khởi động lần đầu
    const initialTimer = window.setTimeout(() => {
      triggerReminderCheck();
    }, 5000);

    const intervalMs = intervalMinutes * 60 * 1000;
    const intervalId = window.setInterval(triggerReminderCheck, intervalMs);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(intervalId);
    };
  }, [reminderEnabled, intervalMinutes, triggerReminderCheck]);

  const dismissBanner = useCallback(() => {
    setInAppBanner(null);
  }, []);

  return {
    reminderEnabled,
    intervalMinutes,
    updateInterval,
    toggleReminder,
    inAppBanner,
    dismissBanner,
    triggerReminderCheck,
    checkScheduledReminders,
  };
}
