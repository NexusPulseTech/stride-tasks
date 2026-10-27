import { useState, useEffect, useRef, useCallback } from 'react';
import { STREAK_KEY, MUTED_KEY, REMINDER_KEY } from '../../../constants';
import { triggerHaptic, playChime } from '../../../utils';
import { UndoAction, Project } from '../../../types';
import { useTranslationRef, formatMessage } from '../../../i18n';

export function useCelebrationAndStreak(projects?: Project[]) {
  const tRef = useTranslationRef();
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

  const showToast = useCallback((msg: string) => {
    triggerHaptic();
    setToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 2200);
  }, []);

  const triggerCelebration = useCallback(() => {
    setShowConfetti(true);
    playChime(isMuted);
    triggerHaptic([25, 50, 25]);
    if (confettiTimerRef.current) window.clearTimeout(confettiTimerRef.current);
    confettiTimerRef.current = window.setTimeout(() => {
      setShowConfetti(false);
    }, 2500);
  }, [isMuted]);

  const triggerUndoableAction = useCallback((message: string, undoFn: () => void) => {
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
        showToast(tRef.current.toast.undoRestored);
      },
    });
    undoTimerRef.current = window.setTimeout(() => {
      setUndoState(null);
    }, 4500);
  }, [showToast]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(MUTED_KEY, String(next));
      } catch (e) {}
      return next;
    });
  }, []);

  const handleDoneStreak = useCallback(() => {
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
  }, [isMuted]);

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
            showToast(tRef.current.toast.remindersOn);
            new Notification(tRef.current.reminder.notificationTitle, {
              body: tRef.current.toast.remindersOn,
              icon: '/icon-192.png',
            });
          } else {
            showToast(tRef.current.toast.notifPermissionDenied);
          }
        } catch (e) {
          showToast(tRef.current.toast.notifEnableFailed);
        }
      } else {
        showToast(tRef.current.toast.notifUnsupported);
      }
    } else {
      setReminderEnabled(false);
      try {
        localStorage.setItem(REMINDER_KEY, 'false');
      } catch (e) {}
      showToast(tRef.current.toast.remindersOff);
    }
  }, [reminderEnabled, showToast]);

  useEffect(() => {
    if (!reminderEnabled) return;
    if (!projects || projects.length === 0) return;
    const checkAndNotify = () => {
      if (typeof window === 'undefined' || !('Notification' in window)) return;
      if (Notification.permission !== 'granted') return;

      const pendingTasks = projects.flatMap((p) => p.tasks).filter((t) => t.status !== 'done');
      if (pendingTasks.length > 0) {
        const topTask = pendingTasks.find((t) => t.isPinned || t.status === 'doing') || pendingTasks[0];
        try {
          new Notification(tRef.current.reminder.notificationTitle, {
            body: formatMessage(tRef.current.reminder.notificationBody, {
              count: pendingTasks.length,
              task: topTask.title.slice(0, 32),
            }),
            icon: '/icon-192.png',
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
