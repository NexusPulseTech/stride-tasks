import React from 'react';
import { Play, Pause, Plus, Check, X, Timer } from 'lucide-react';
import {
  FocusTimerSession,
  FocusPresetMode,
  FOCUS_PRESET_DURATIONS,
} from '../hooks/useFocusTimer';
import { useLanguage } from '../../../i18n';

interface ActiveFocusStripProps {
  session: FocusTimerSession | null;
  onTogglePauseResume: () => void;
  onSwitchPreset: (mode: FocusPresetMode) => void;
  onAddFiveMinutes: () => void;
  onCompleteTaskNow: (projectId: string, taskId: string) => void;
  onStopSession: () => void;
  onOpenTaskDetail?: (taskId: string, projectId: string) => void;
}

export function ActiveFocusStrip({
  session,
  onTogglePauseResume,
  onSwitchPreset,
  onAddFiveMinutes,
  onCompleteTaskNow,
  onStopSession,
  onOpenTaskDetail,
}: ActiveFocusStripProps) {
  const { language } = useLanguage();

  if (!session) return null;

  const mins = Math.floor(session.remainingSeconds / 60);
  const secs = session.remainingSeconds % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const progressPct =
    session.durationSeconds > 0
      ? Math.min(100, Math.max(0, Math.round(((session.durationSeconds - session.remainingSeconds) / session.durationSeconds) * 100)))
      : 0;

  const presets: FocusPresetMode[] = ['work-15', 'work-25', 'work-50', 'break-5'];

  return (
    <div className="bg-white dark:bg-[#161b22] border border-slate-200/90 dark:border-slate-800 rounded-xl p-2.5 sm:p-3 shadow-xs transition-colors overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Left: Timer readout & active task */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className={`h-9 px-2.5 rounded-lg font-mono tabular-nums text-sm sm:text-base font-bold flex items-center gap-1.5 shrink-0 border ${
              session.mode === 'break-5'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                : session.isRunning
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100'
                : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-400/40'
            }`}
          >
            <Timer className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
            <span>{formattedTime}</span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
              <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                {session.projectName}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {progressPct}%
              </span>
            </div>
            <button
              type="button"
              onClick={() => onOpenTaskDetail?.(session.taskId, session.projectId)}
              className="text-xs sm:text-[13px] font-semibold text-slate-900 dark:text-slate-100 hover:underline truncate block max-w-full text-left cursor-pointer"
              title={session.taskTitle}
            >
              {session.taskTitle}
            </button>
          </div>
        </div>

        {/* Right: Presets & Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-1.5 flex-wrap sm:flex-nowrap shrink-0">
          {/* Preset selector */}
          <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800/90 p-0.5 rounded-lg">
            {presets.map((preset) => {
              const info = FOCUS_PRESET_DURATIONS[preset];
              const isActive = session.mode === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onSwitchPreset(preset)}
                  className={`h-6.5 px-1.5 rounded-md text-[10.5px] font-mono tabular-nums font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={language === 'vi' ? info.labelVi : info.labelEn}
                >
                  {preset === 'break-5' ? (language === 'vi' ? 'Nghỉ 5p' : '5m Break') : `${info.minutes}m`}
                </button>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onTogglePauseResume}
              className="h-7.5 px-2.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors shrink-0 whitespace-nowrap"
              title={session.isRunning ? (language === 'vi' ? 'Tạm dừng' : 'Pause') : (language === 'vi' ? 'Tiếp tục' : 'Resume')}
            >
              {session.isRunning ? (
                <>
                  <Pause className="w-3 h-3 shrink-0" />
                  <span>{language === 'vi' ? 'Dừng' : 'Pause'}</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 shrink-0" />
                  <span>{language === 'vi' ? 'Chạy' : 'Start'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onAddFiveMinutes}
              className="h-7.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-mono tabular-nums font-medium flex items-center gap-0.5 cursor-pointer transition-colors shrink-0 whitespace-nowrap"
              title={language === 'vi' ? 'Cộng thêm 5 phút' : 'Add 5 minutes'}
            >
              <Plus className="w-3 h-3 shrink-0" />
              <span>5m</span>
            </button>

            <button
              type="button"
              onClick={() => onCompleteTaskNow(session.projectId, session.taskId)}
              className="h-7.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors shrink-0 whitespace-nowrap"
              title={language === 'vi' ? 'Hoàn thành việc này & lưu số phút tập trung' : 'Complete task & log focus time'}
            >
              <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={2.25} />
              <span className="hidden xs:inline">{language === 'vi' ? 'Xong' : 'Done'}</span>
            </button>

            <button
              type="button"
              onClick={onStopSession}
              className="h-7.5 w-7.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-center cursor-pointer transition-colors shrink-0"
              title={language === 'vi' ? 'Kết thúc phiên & lưu số phút đã làm' : 'End session & log elapsed minutes'}
              aria-label="End focus session"
            >
              <X className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* Subtle hairline progress bar */}
      <div className="mt-2 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            session.mode === 'break-5' ? 'bg-emerald-500' : 'bg-slate-900 dark:bg-slate-200'
          }`}
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}
