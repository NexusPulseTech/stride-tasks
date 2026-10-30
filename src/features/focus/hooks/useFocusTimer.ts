import { useState, useEffect, useCallback, useRef } from 'react';
import { playChime, triggerHaptic } from '../../../utils';
import { useTranslationRef, formatMessage } from '../../../i18n';

export type FocusPresetMode = 'work-15' | 'work-25' | 'work-50' | 'break-5';

export interface FocusTimerSession {
  taskId: string;
  projectId: string;
  taskTitle: string;
  projectName: string;
  mode: FocusPresetMode;
  durationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  targetEndTimeMs: number | null;
  /** Định danh của chu kỳ đếm hiện tại, đổi mỗi khi bắt đầu lại / đổi preset */
  startedAtMs: number;
  /** true khi số phút của chu kỳ này đã được ghi, chặn ghi trùng */
  logged?: boolean;
}

const FOCUS_STORAGE_KEY = 'STRIDE_FOCUS_TIMER_V1';
// Tiêu đề gốc trong index.html (phục vụ SEO); chỉ thay tiêu đề tab khi đồng hồ đang chạy
const BASE_DOCUMENT_TITLE = typeof document !== 'undefined' ? document.title : 'Stride Tasks';

export const FOCUS_PRESET_DURATIONS: Record<FocusPresetMode, { seconds: number; minutes: number; labelVi: string; labelEn: string }> = {
  'work-15': { seconds: 15 * 60, minutes: 15, labelVi: '15p Sprint', labelEn: '15m Sprint' },
  'work-25': { seconds: 25 * 60, minutes: 25, labelVi: '25p Pomodoro', labelEn: '25m Pomodoro' },
  'work-50': { seconds: 50 * 60, minutes: 50, labelVi: '50p Deep Work', labelEn: '50m Deep Work' },
  'break-5': { seconds: 5 * 60, minutes: 5, labelVi: '5p Nghỉ ngơi', labelEn: '5m Break' },
};

export interface FocusLogEvent {
  projectId: string;
  taskId: string;
  minutes: number;
  /** true khi chạy hết chu kỳ, false khi dừng sớm / đổi preset giữa chừng */
  completedSession: boolean;
  /** startedAtMs của chu kỳ, dùng để chỉ tính 1 lượt dùng thử cho mỗi chu kỳ */
  sessionId: number;
}

interface UseFocusTimerDeps {
  isMuted: boolean;
  showToast: (msg: string) => void;
  onLogFocusedMinutes: (event: FocusLogEvent) => void;
}

function persist(next: FocusTimerSession | null): void {
  try {
    if (next) localStorage.setItem(FOCUS_STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(FOCUS_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

function remainingOf(session: FocusTimerSession, now = Date.now()): number {
  if (session.isRunning && session.targetEndTimeMs) {
    return Math.max(0, Math.ceil((session.targetEndTimeMs - now) / 1000));
  }
  return session.remainingSeconds;
}

function elapsedWorkMinutes(session: FocusTimerSession): number {
  if (session.mode === 'break-5' || session.logged) return 0;
  return Math.floor(Math.max(0, session.durationSeconds - remainingOf(session)) / 60);
}

function readStoredSession(): FocusTimerSession | null {
  try {
    const saved = localStorage.getItem(FOCUS_STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as FocusTimerSession;
    return parsed && parsed.taskId ? parsed : null;
  } catch {
    return null;
  }
}

export function useFocusTimer({ isMuted, showToast, onLogFocusedMinutes }: UseFocusTimerDeps) {
  const tRef = useTranslationRef();
  const [session, setSession] = useState<FocusTimerSession | null>(() => {
    const stored = readStoredSession();
    if (!stored) return null;
    // Phiên đã hết giờ trong lúc đóng tab: giữ nguyên trạng thái "đang chạy, logged=false" để effect bên dưới
    // ghi bù đúng 1 lần rồi lưu lại, không đánh dấu logged ở đây (nếu không sẽ mất phút khi reload).
    if (stored.isRunning && stored.targetEndTimeMs) {
      return { ...stored, remainingSeconds: remainingOf(stored) };
    }
    return stored;
  });

  const onLogRef = useRef(onLogFocusedMinutes);
  const showToastRef = useRef(showToast);
  const isMutedRef = useRef(isMuted);
  onLogRef.current = onLogFocusedMinutes;
  showToastRef.current = showToast;
  isMutedRef.current = isMuted;

  // Chặn ghi trùng trong cùng phiên chạy app (StrictMode gọi effect 2 lần ở dev)
  const loggedCyclesRef = useRef<Set<number>>(new Set());

  const persistSession = useCallback((next: FocusTimerSession | null) => {
    setSession(next);
    persist(next);
  }, []);

  const logCycle = useCallback((s: FocusTimerSession, minutes: number, completedSession: boolean): boolean => {
    if (minutes < 1 || s.mode === 'break-5' || s.logged || loggedCyclesRef.current.has(s.startedAtMs)) return false;
    loggedCyclesRef.current.add(s.startedAtMs);
    onLogRef.current({
      projectId: s.projectId,
      taskId: s.taskId,
      minutes,
      completedSession,
      sessionId: s.startedAtMs,
    });
    return true;
  }, []);

  /** Hoàn tất chu kỳ: ghi phút (1 lần), báo hiệu và lưu trạng thái đã kết thúc */
  const finishCycle = useCallback(
    (s: FocusTimerSession, silent: boolean) => {
      const isBreak = s.mode === 'break-5';
      const earnedMinutes = Math.max(1, Math.round(s.durationSeconds / 60));
      const didLog = logCycle(s, earnedMinutes, true);
      if (!silent) {
        if (!isMutedRef.current) playChime(false);
        triggerHaptic();
      }
      if (didLog) {
        showToastRef.current(formatMessage(tRef.current.toast.focusCompleted, { minutes: earnedMinutes, title: s.taskTitle.slice(0, 28) }));
      } else if (isBreak && !silent) {
        showToastRef.current(formatMessage(tRef.current.toast.breakFinished, { minutes: FOCUS_PRESET_DURATIONS[s.mode].minutes }));
      }
      persistSession({ ...s, remainingSeconds: 0, isRunning: false, targetEndTimeMs: null, logged: true });
    },
    [logCycle, persistSession]
  );

  // Ghi bù phiên đã chạy hết giờ trong lúc tab bị đóng / máy ngủ (chạy 1 lần khi khởi động)
  useEffect(() => {
    if (session && session.isRunning && session.targetEndTimeMs && remainingOf(session) <= 0 && !session.logged) {
      finishCycle(session, true);
    }
  }, []);

  // Đếm ngược theo mốc thời gian tuyệt đối (không trôi khi tab chạy nền); side-effect nằm ngoài state updater
  useEffect(() => {
    if (!session || !session.isRunning || !session.targetEndTimeMs) return;
    const interval = window.setInterval(() => {
      const remaining = remainingOf(session);
      if (remaining <= 0) {
        window.clearInterval(interval);
        finishCycle(session, false);
        return;
      }
      const updated: FocusTimerSession = { ...session, remainingSeconds: remaining };
      setSession(updated);
      persist(updated);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [session, finishCycle]);

  // Đồng bộ đồng hồ đếm ngược lên tiêu đề tab trình duyệt
  useEffect(() => {
    const defaultTitle = BASE_DOCUMENT_TITLE;
    if (!session || !session.isRunning) {
      document.title = defaultTitle;
      return;
    }
    const mins = String(Math.floor(session.remainingSeconds / 60)).padStart(2, '0');
    const secs = String(session.remainingSeconds % 60).padStart(2, '0');
    document.title = `⏳ ${mins}:${secs} · ${session.taskTitle.slice(0, 24)} | Stride Tasks`;
    return () => {
      document.title = defaultTitle;
    };
  }, [session?.isRunning, session?.remainingSeconds, session?.taskTitle]);

  const startFocusForTask = useCallback(
    (taskId: string, projectId: string, taskTitle: string, projectName: string, mode: FocusPresetMode = 'work-25') => {
      triggerHaptic();
      // Đang có chu kỳ làm việc dở dang cho việc khác → ghi lại phần đã làm trước khi chuyển
      if (session && !session.logged) {
        logCycle(session, elapsedWorkMinutes(session), false);
      }
      const durationSeconds = FOCUS_PRESET_DURATIONS[mode].seconds;
      const now = Date.now();
      persistSession({
        taskId,
        projectId,
        taskTitle,
        projectName,
        mode,
        durationSeconds,
        remainingSeconds: durationSeconds,
        isRunning: true,
        targetEndTimeMs: now + durationSeconds * 1000,
        startedAtMs: now,
        logged: false,
      });
    },
    [session, logCycle, persistSession]
  );

  const togglePauseResume = useCallback(() => {
    if (!session) return;
    triggerHaptic();
    if (session.isRunning) {
      persistSession({ ...session, remainingSeconds: remainingOf(session), isRunning: false, targetEndTimeMs: null });
      return;
    }
    const now = Date.now();
    if (session.logged || session.remainingSeconds <= 0) {
      // Chu kỳ đã kết thúc → bắt đầu chu kỳ mới cùng preset
      persistSession({
        ...session,
        remainingSeconds: session.durationSeconds,
        isRunning: true,
        targetEndTimeMs: now + session.durationSeconds * 1000,
        startedAtMs: now,
        logged: false,
      });
      return;
    }
    persistSession({ ...session, isRunning: true, targetEndTimeMs: now + session.remainingSeconds * 1000 });
  }, [session, persistSession]);

  const switchPresetMode = useCallback(
    (mode: FocusPresetMode) => {
      if (!session) return;
      triggerHaptic();
      const partial = elapsedWorkMinutes(session);
      if (logCycle(session, partial, false)) {
        showToast(formatMessage(tRef.current.toast.focusPartialLogged, { minutes: partial }));
      }
      const durationSeconds = FOCUS_PRESET_DURATIONS[mode].seconds;
      const now = Date.now();
      persistSession({
        ...session,
        mode,
        durationSeconds,
        remainingSeconds: durationSeconds,
        isRunning: true,
        targetEndTimeMs: now + durationSeconds * 1000,
        startedAtMs: now,
        logged: false,
      });
    },
    [session, logCycle, persistSession, showToast]
  );

  const addFiveMinutes = useCallback(() => {
    if (!session) return;
    triggerHaptic();
    const extra = 5 * 60;
    const now = Date.now();
    if (session.logged) {
      // Phiên đã kết thúc và đã ghi → +5 phút là một chu kỳ mới 5 phút
      persistSession({
        ...session,
        durationSeconds: extra,
        remainingSeconds: extra,
        isRunning: true,
        targetEndTimeMs: now + extra * 1000,
        startedAtMs: now,
        logged: false,
      });
    } else {
      const nextRemaining = remainingOf(session) + extra;
      persistSession({
        ...session,
        durationSeconds: session.durationSeconds + extra,
        remainingSeconds: nextRemaining,
        targetEndTimeMs: session.isRunning ? now + nextRemaining * 1000 : null,
      });
    }
    showToast(tRef.current.toast.focusPlusFive);
  }, [session, persistSession, showToast]);

  const stopAndLogElapsed = useCallback(() => {
    if (!session) return;
    triggerHaptic();
    const minutes = elapsedWorkMinutes(session);
    if (logCycle(session, minutes, false)) {
      showToast(formatMessage(tRef.current.toast.focusLogged, { minutes }));
    }
    persistSession(null);
  }, [session, logCycle, persistSession, showToast]);

  return {
    session,
    startFocusForTask,
    togglePauseResume,
    switchPresetMode,
    addFiveMinutes,
    stopAndLogElapsed,
  };
}
