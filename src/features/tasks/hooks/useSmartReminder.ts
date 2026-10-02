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
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(REMINDER_KEY) === 'true';
    } catch (e) {
      return false;
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
  } | null>(null);

  const bannerTimerRef = useRef<number | null>(null);

  const updateInterval = useCallback((mins: ReminderIntervalMinutes) => {
    setIntervalMinutes(mins);
    try {
      localStorage.setItem(REMINDER_INTERVAL_KEY, String(mins));
    } catch (e) {}
  }, []);

  const triggerReminderCheck = useCallback(() => {
    const pendingTasks = projects.flatMap((p) => p.tasks).filter((t) => t.status !== 'done');
    if (pendingTasks.length === 0) {
      setInAppBanner(null);
      return;
    }

    const topTask = pendingTasks.find((t) => t.isPinned || t.status === 'doing') || pendingTasks[0];
    playChime(isMuted);

    // 1. Gửi Web Notification hệ thống (nếu được cấp quyền)
    let webNotifSent = false;
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('🎯 Stride Tasks - Nhắc nhở tập trung', {
          body: `Bạn còn ${pendingTasks.length} công việc chưa hoàn thành! Việc ưu tiên: "${topTask.title.slice(0, 36)}..."`,
          icon: '/stride-tasks-icon.svg',
        });
        webNotifSent = true;
      } catch (e) {}
    }

    // 2. Hiển thị In-App Banner tinh tế nếu tab đang active hoặc nếu chưa có Web Notif
    setInAppBanner({
      visible: true,
      pendingCount: pendingTasks.length,
      topTaskTitle: topTask.title,
    });

    if (bannerTimerRef.current) window.clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = window.setTimeout(() => {
      setInAppBanner((prev) => (prev ? { ...prev, visible: false } : null));
    }, 8000);
  }, [projects, isMuted]);

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
            showToast('Đã kích hoạt nhắc việc định kỳ!');
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
      showToast('Đã bật nhắc nhở công việc (thông báo trong app)!');
      triggerReminderCheck();
    } else {
      setReminderEnabled(false);
      try {
        localStorage.setItem(REMINDER_KEY, 'false');
      } catch (e) {}
      setInAppBanner(null);
      showToast('Đã tắt nhắc nhở công việc');
    }
  }, [reminderEnabled, showToast, triggerReminderCheck]);

  // Bộ định thời chạy chu kỳ
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
  };
}
