import { useState, useEffect, useRef } from 'react';
import { STREAK_KEY, MUTED_KEY, REMINDER_KEY } from '../../../constants';
import { triggerHaptic, playChime } from '../../../utils';
import { UndoAction, Project } from '../../../types';

export function useCelebrationAndStreak(projects: Project[]) {
  const [streak, setStreak] = useState<number>(() => {
    try {
      const s = localStorage.getItem(STREAK_KEY);
      if (s) return JSON.parse(s).count || 1;
    } catch (e) {}
    return 1;
  });

  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(MUTED_KEY) === 'true';
    } catch (e) {
      return false;
    }
  });

  const [showConfetti, setShowConfetti] = useState(false);
  const confettiTimerRef = useRef<number | null>(null);

  const [undoState, setUndoState] = useState<UndoAction | null>(null);
  const undoTimerRef = useRef<number | null>(null);

  const [reminderEnabled, setReminderEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(REMINDER_KEY) === 'true';
    } catch (e) {
      return false;
    }
  });

  const showToast = (msg: string) => {
    triggerHaptic();
    setToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 2200);
  };

  const triggerCelebration = () => {
    setShowConfetti(true);
    playChime(isMuted);
    triggerHaptic([25, 50, 25]);
    if (confettiTimerRef.current) window.clearTimeout(confettiTimerRef.current);
    confettiTimerRef.current = window.setTimeout(() => {
      setShowConfetti(false);
    }, 2500);
  };

  const triggerUndoableAction = (message: string, undoFn: () => void) => {
    triggerHaptic();
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    const actionId = Date.now().toString();
    setUndoState({
      id: actionId,
      message,
      undo: () => {
        triggerHaptic();
        undoFn();
        setUndoState(null);
        showToast('Đã khôi phục thành công!');
      },
    });
    undoTimerRef.current = window.setTimeout(() => {
      setUndoState(null);
    }, 4500);
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    try {
      localStorage.setItem(MUTED_KEY, String(next));
    } catch (e) {}
  };

  const handleDoneStreak = () => {
    playChime(isMuted);
    const today = new Date().toISOString().slice(0, 10);
    try {
      const raw = localStorage.getItem(STREAK_KEY);
      const data = raw ? JSON.parse(raw) : { count: 1, lastDate: '' };
      if (data.lastDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().slice(0, 10);
        if (data.lastDate === yStr) {
          data.count += 1;
        } else if (!data.lastDate) {
          data.count = 1;
        }
        data.lastDate = today;
        localStorage.setItem(STREAK_KEY, JSON.stringify(data));
        setStreak(data.count);
      }
    } catch (e) {}
  };

  const toggleReminder = async () => {
    if (!reminderEnabled) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        try {
          const perm = await Notification.requestPermission();
          if (perm === 'granted') {
            setReminderEnabled(true);
            try {
              localStorage.setItem(REMINDER_KEY, 'true');
            } catch (e) {}
            showToast('Đã bật nhắc nhở công việc đang dở!');
            new Notification('🎯 Solo Checklist', {
              body: 'Đã kích hoạt nhắc nhở! App sẽ giúp bạn theo dõi các việc dở dang.',
            });
          } else {
            showToast('Trình duyệt chưa cấp quyền thông báo');
          }
        } catch (e) {
          showToast('Không thể bật thông báo');
        }
      } else {
        showToast('Thiết bị không hỗ trợ Web Notification');
      }
    } else {
      setReminderEnabled(false);
      try {
        localStorage.setItem(REMINDER_KEY, 'false');
      } catch (e) {}
      showToast('Đã tắt nhắc nhở');
    }
  };

  useEffect(() => {
    if (!reminderEnabled) return;
    const checkAndNotify = () => {
      if (typeof window === 'undefined' || !('Notification' in window)) return;
      if (Notification.permission !== 'granted') return;

      const pendingTasks = projects.flatMap((p) => p.tasks).filter((t) => t.status !== 'done');
      if (pendingTasks.length > 0) {
        const topTask = pendingTasks.find((t) => t.isPinned || t.status === 'doing') || pendingTasks[0];
        try {
          new Notification('🎯 Solo Checklist - Nhắc việc', {
            body: `Bạn còn ${pendingTasks.length} việc chưa hoàn thành! Việc tiếp theo: "${topTask.title.slice(0, 32)}..."`,
          });
        } catch (e) {}
      }
    };

    const interval = window.setInterval(checkAndNotify, 20 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [reminderEnabled, projects]);

  return {
    streak,
    toast,
    showToast,
    isMuted,
    toggleMute,
    showConfetti,
    triggerCelebration,
    undoState,
    setUndoState,
    triggerUndoableAction,
    reminderEnabled,
    toggleReminder,
    handleDoneStreak,
  };
}
