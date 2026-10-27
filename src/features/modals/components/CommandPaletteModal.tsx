import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  LayoutGrid,
  List,
  Target,
  Play,
  FileText,
  Crown,
  Sun,
  Download,
  Eye,
  Activity,
  Check,
  ArrowRight,
  CornerDownLeft,
  Plus,
  Layers,
} from 'lucide-react';
import { Project, Task, WorkspaceViewMode } from '../../../types';
import { isDoneStatus } from '../../tasks/utils/statusCategory';
import { SmartCaptureHelperBar } from '../../tasks/components/SmartCaptureHelperBar';
import { useLanguage } from '../../../i18n';
import { triggerHaptic } from '../../../utils';

export interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  workspaceViewMode: WorkspaceViewMode;
  onSwitchViewMode: (mode: WorkspaceViewMode) => void;
  onOpenDailyFocus: () => void;
  onOpenMarkdownReport: () => void;
  /** Không truyền khi paywall tắt → lệnh PRO bị ẩn */
  onOpenStoreModal?: () => void;
  onToggleZenMode: () => void;
  onToggleStats: () => void;
  onCycleTheme: () => void;
  onExportBackupJson: () => void;
  onOpenTaskDetail: (task: Task, projectId: string) => void;
  onStartFocusTask: (task: Task, project: Project) => void;
  onToggleTaskDone: (projectId: string, taskId: string, done: boolean) => void;
  onOpenAnkiSrs?: (task: Task, projectId: string) => void;
  onQuickCreateTask?: (projectId: string, title: string) => void;
}

interface PaletteCommandItem {
  id: string;
  group: 'command' | 'task' | 'create';
  title: string;
  subtitle: string;
  shortcut?: string;
  icon: React.ReactNode;
  onSelect: () => void;
  taskRef?: { task: Task; project: Project };
}

export function CommandPaletteModal({
  isOpen,
  onClose,
  projects,
  workspaceViewMode,
  onSwitchViewMode,
  onOpenDailyFocus,
  onOpenMarkdownReport,
  onOpenStoreModal,
  onToggleZenMode,
  onToggleStats,
  onCycleTheme,
  onExportBackupJson,
  onOpenTaskDetail,
  onStartFocusTask,
  onToggleTaskDone,
  onOpenAnkiSrs,
  onQuickCreateTask,
}: CommandPaletteModalProps) {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState('');
  const [filterScope, setFilterScope] = useState<'all' | 'command' | 'task'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setFilterScope('all');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [isOpen]);

  const allItems = useMemo<PaletteCommandItem[]>(() => {
    const q = query.trim().toLowerCase();

    const commands: PaletteCommandItem[] = [
      {
        id: 'cmd-toggle-board',
        group: 'command',
        title:
          workspaceViewMode === 'list'
            ? language === 'vi'
              ? 'Chuyển sang Bảng Kanban 4 Cột (Linear Board)'
              : 'Switch to 4-Column Kanban Board View'
            : language === 'vi'
            ? 'Chuyển về Chế độ Danh sách (List View)'
            : 'Switch to Standard List View',
        subtitle: language === 'vi' ? 'Chế độ hiển thị không gian làm việc' : 'Workspace layout mode',
        shortcut: 'B',
        icon:
          workspaceViewMode === 'list' ? (
            <LayoutGrid className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          ) : (
            <List className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          ),
        onSelect: () => {
          onClose();
          onSwitchViewMode(workspaceViewMode === 'list' ? 'board' : 'list');
        },
      },
      {
        id: 'cmd-daily-focus',
        group: 'command',
        title:
          language === 'vi'
            ? 'Mở Tiêu điểm Hôm nay & Ôn tập Anki SM-2'
            : 'Open Daily Focus & Anki SM-2 Review Queue',
        subtitle: language === 'vi' ? 'Phím tắt 1-2-3 chấm điểm lặp lại ngắt quãng' : 'Spaced repetition review queue',
        shortcut: '1-2-3',
        icon: <Target className="w-4 h-4 text-amber-500" />,
        onSelect: () => {
          onClose();
          onOpenDailyFocus();
        },
      },
      {
        id: 'cmd-markdown-report',
        group: 'command',
        title:
          language === 'vi'
            ? 'Xuất Báo cáo Tiến độ Markdown (Obsidian / Notion / Standup)'
            : 'Export Progress Report as Markdown (Obsidian / Notion / Standup)',
        subtitle: language === 'vi' ? 'Tổng hợp việc đã xong, đang làm & số phút Pomodoro' : 'Generate daily standup & Obsidian note',
        shortcut: 'MD',
        icon: <FileText className="w-4 h-4 text-emerald-500" />,
        onSelect: () => {
          onClose();
          onOpenMarkdownReport();
        },
      },
      {
        id: 'cmd-stats-heatmap',
        group: 'command',
        title:
          language === 'vi'
            ? 'Bật / Tắt Bản đồ Nhịp độ & Chuỗi ngày (Rhythm Heatmap)'
            : 'Toggle Rhythm Heatmap & Activity Analytics',
        subtitle: language === 'vi' ? 'Biểu đồ nhiệt theo dõi năng suất' : 'Visual completion history',
        icon: <Activity className="w-4 h-4 text-sky-500" />,
        onSelect: () => {
          onClose();
          onToggleStats();
        },
      },
      {
        id: 'cmd-zen-mode',
        group: 'command',
        title:
          language === 'vi'
            ? 'Bật / Tắt Chế độ Tối giản (Zen Mode)'
            : 'Toggle Minimalist Zen Mode',
        subtitle: language === 'vi' ? 'Ẩn toàn bộ thanh công cụ phụ trợ' : 'Distraction-free workspace',
        icon: <Eye className="w-4 h-4 text-slate-500" />,
        onSelect: () => {
          onClose();
          onToggleZenMode();
        },
      },
      {
        id: 'cmd-theme',
        group: 'command',
        title:
          language === 'vi'
            ? 'Chuyển đổi Giao diện Sáng / Tối / Hệ thống'
            : 'Cycle Light / Dark / System Theme',
        subtitle: language === 'vi' ? 'Đổi màu nền tức thì' : 'Switch color scheme',
        shortcut: 'D',
        icon: <Sun className="w-4 h-4 text-amber-500" />,
        onSelect: () => {
          onClose();
          onCycleTheme();
        },
      },
      {
        id: 'cmd-backup',
        group: 'command',
        title:
          language === 'vi'
            ? 'Tải xuống Bản sao lưu toàn diện (.JSON)'
            : 'Download Full Workspace Backup (.JSON)',
        subtitle: language === 'vi' ? 'Lưu trữ an toàn 100% ngoại tuyến' : '100% local-first snapshot',
        icon: <Download className="w-4 h-4 text-slate-500" />,
        onSelect: () => {
          onClose();
          onExportBackupJson();
        },
      },
      ...(onOpenStoreModal
        ? [
            {
              id: 'cmd-store-pro',
              group: 'command' as const,
              title: t.store.paletteTitle,
              subtitle: t.store.paletteSubtitle,
              shortcut: 'PRO',
              icon: <Crown className="w-4 h-4 text-amber-500" />,
              onSelect: () => {
                onClose();
                onOpenStoreModal();
              },
            },
          ]
        : []),
    ];

    const filteredCommands =
      filterScope === 'task'
        ? []
        : q
        ? commands.filter(
            (c) =>
              c.title.toLowerCase().includes(q) ||
              c.subtitle.toLowerCase().includes(q)
          )
        : commands;

    const taskItems: PaletteCommandItem[] = [];
    if (filterScope !== 'command') {
      projects.forEach((proj) => {
        proj.tasks.forEach((task) => {
          if (q) {
            const matchTitle = task.title.toLowerCase().includes(q);
            const matchProj = proj.name.toLowerCase().includes(q);
            const matchSub = task.subtasks?.some((s) => s.title.toLowerCase().includes(q));
            if (!matchTitle && !matchProj && !matchSub) return;
          }
          const done = isDoneStatus(task.status);
          taskItems.push({
            id: `task-${proj.id}-${task.id}`,
            group: 'task',
            title: task.title,
            subtitle: `${proj.name}${task.focusedMinutes ? ` · ${task.focusedMinutes}m Focus` : ''}${
              task.snoozeLevel && task.snoozeLevel > 1 ? ` · SRS Lv.${task.snoozeLevel}` : ''
            }`,
            icon: done ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <ArrowRight className="w-4 h-4 text-slate-400" />
            ),
            taskRef: { task, project: proj },
            onSelect: () => {
              onClose();
              onOpenTaskDetail(task, proj.id);
            },
          });
        });
      });
    }

    // Quick Create Task (Chuẩn Linear / Things 3 Quick Entry / Godspeed) khi gõ từ khóa bất kỳ
    const quickCreateItems: PaletteCommandItem[] = [];
    if (query.trim().length >= 2 && projects.length > 0 && onQuickCreateTask) {
      const targetProj = projects[0];
      quickCreateItems.push({
        id: 'cmd-quick-create-task',
        group: 'create',
        title:
          language === 'vi'
            ? `Tạo nhanh công việc: "${query.trim()}"`
            : `Create new task: "${query.trim()}"`,
        subtitle:
          language === 'vi'
            ? `Thêm trực tiếp vào dự án "${targetProj.name}" (Linear Quick Entry)`
            : `Add directly into project "${targetProj.name}"`,
        shortcut: 'NEW',
        icon: <Plus className="w-4 h-4 text-emerald-500" />,
        onSelect: () => {
          onQuickCreateTask(targetProj.id, query.trim());
          onClose();
        },
      });
    }

    return [...filteredCommands, ...taskItems.slice(0, 25), ...quickCreateItems];
  }, [
    query,
    filterScope,
    workspaceViewMode,
    language,
    projects,
    onClose,
    onSwitchViewMode,
    onOpenDailyFocus,
    onOpenMarkdownReport,
    onToggleStats,
    onToggleZenMode,
    onCycleTheme,
    onExportBackupJson,
    onOpenStoreModal,
    onOpenTaskDetail,
    onQuickCreateTask,
  ]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, filterScope]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (allItems.length > 0 ? (prev + 1) % allItems.length : 0));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          allItems.length > 0 ? (prev - 1 + allItems.length) % allItems.length : 0
        );
        return;
      }
      if (e.key === 'Enter') {
        const current = allItems[selectedIndex];
        if (!current) return;
        e.preventDefault();
        triggerHaptic();

        // Shift + Enter trên một Task: Chạy ngay đồng hồ Focus Pomodoro 25 phút
        if (e.shiftKey && current.taskRef) {
          onClose();
          onStartFocusTask(current.taskRef.task, current.taskRef.project);
          return;
        }

        // Alt + Enter trên một Task: Mở hộp thoại Ôn tập Anki SM-2
        if (e.altKey && current.taskRef && onOpenAnkiSrs) {
          onClose();
          onOpenAnkiSrs(current.taskRef.task, current.taskRef.project.id);
          return;
        }

        // Ctrl/Cmd + Enter trên một Task: Đánh dấu hoàn thành ngay
        if ((e.ctrlKey || e.metaKey) && current.taskRef) {
          const isDone = isDoneStatus(current.taskRef.task.status);
          onToggleTaskDone(current.taskRef.project.id, current.taskRef.task.id, !isDone);
          onClose();
          return;
        }

        current.onSelect();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, allItems, selectedIndex, onClose, onStartFocusTask, onToggleTaskDone, onOpenAnkiSrs]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      style={{ zIndex: 10015 }}
      className="fixed inset-0 z-[10015] bg-slate-950/60 backdrop-blur-xs flex items-start justify-center pt-[9vh] p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[78vh]"
      >
        {/* Search Input Header */}
        <div className="h-12 px-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2.5 shrink-0">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              language === 'vi'
                ? 'Gõ lệnh nhanh, tìm việc hoặc gõ tên để tạo việc mới... (Ctrl+K)'
                : 'Type a command, search tasks, or type to create task... (Ctrl+K)'
            }
            className="flex-1 min-w-0 h-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-slate-700 rounded shrink-0">
            ESC
          </kbd>
        </div>

        {/* Scope Filter Bar (All / Commands / Tasks) */}
        <div className="px-3.5 py-1.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#12161f] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1">
            {(
              [
                { id: 'all', labelVi: 'Tất cả', labelEn: 'All' },
                { id: 'command', labelVi: 'Lệnh hệ thống', labelEn: 'Commands' },
                { id: 'task', labelVi: 'Công việc', labelEn: 'Tasks' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterScope(tab.id)}
                className={`h-6 px-2.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  filterScope === tab.id
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {language === 'vi' ? tab.labelVi : tab.labelEn}
              </button>
            ))}
          </div>
          <span className="text-[10.5px] font-mono tabular-nums text-slate-400">
            {allItems.length} {language === 'vi' ? 'kết quả' : 'results'}
          </span>
        </div>

        {/* Interactive Smart Capture Helper Bar when typing Quick Entry */}
        {query.trim().length > 0 && projects.length > 0 && (
          <div className="px-3.5 py-1.5 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#161b22] shrink-0">
            <SmartCaptureHelperBar
              value={query}
              onChange={(nextVal) => {
                setQuery(nextVal);
                inputRef.current?.focus();
              }}
              compact
            />
          </div>
        )}

        {/* Results List */}
        <div className="p-2 overflow-y-auto space-y-1 flex-1">
          {allItems.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400 dark:text-slate-500">
              {language === 'vi'
                ? 'Không tìm thấy lệnh hoặc công việc nào khớp từ khóa.'
                : 'No matching commands or tasks found.'}
            </div>
          ) : (
            allItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => {
                    triggerHaptic();
                    item.onSelect();
                  }}
                  className={`px-3 py-2 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="shrink-0">{item.icon}</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold truncate">{item.title}</div>
                      <div
                        className={`text-[11px] truncate ${
                          isSelected
                            ? 'text-slate-300 dark:text-slate-600'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {item.taskRef && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                            onStartFocusTask(item.taskRef!.task, item.taskRef!.project);
                          }}
                          className={`h-6 px-2 rounded text-[10.5px] font-medium flex items-center gap-1 cursor-pointer ${
                            isSelected
                              ? 'bg-white/15 text-white dark:bg-slate-900/15 dark:text-slate-900'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                          title="Shift + Enter: Start Pomodoro Focus"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          <span>Focus</span>
                        </button>

                        {onOpenAnkiSrs && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onClose();
                              onOpenAnkiSrs(item.taskRef!.task, item.taskRef!.project.id);
                            }}
                            className={`h-6 px-1.5 rounded text-[10.5px] font-mono font-medium hidden sm:flex items-center gap-1 cursor-pointer ${
                              isSelected
                                ? 'bg-white/15 text-white dark:bg-slate-900/15 dark:text-slate-900'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                            title="Alt + Enter: Anki SM-2 Spaced Repetition"
                          >
                            <Layers className="w-2.5 h-2.5" />
                            <span>SRS</span>
                          </button>
                        )}
                      </>
                    )}

                    {item.shortcut ? (
                      <kbd
                        className={`px-1.5 py-0.5 text-[10px] font-mono rounded border ${
                          isSelected
                            ? 'border-white/30 text-white dark:border-slate-900/30 dark:text-slate-900'
                            : 'border-slate-200 dark:border-slate-700 text-slate-400'
                        }`}
                      >
                        {item.shortcut}
                      </kbd>
                    ) : (
                      <CornerDownLeft className="w-3.5 h-3.5 opacity-50" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hints */}
        <div className="px-3.5 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-[#12161f] flex items-center justify-between gap-2 text-[11px] text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span>↑↓ {language === 'vi' ? 'Chọn' : 'Navigate'}</span>
            <span>·</span>
            <span>Enter {language === 'vi' ? 'Mở' : 'Open'}</span>
            <span>·</span>
            <span>Shift+Enter {language === 'vi' ? 'Focus 25p' : 'Focus 25m'}</span>
            <span>·</span>
            <span>Alt+Enter {language === 'vi' ? 'Anki SRS' : 'Anki SRS'}</span>
            <span>·</span>
            <span>Ctrl+Enter {language === 'vi' ? 'Hoàn thành' : 'Done'}</span>
          </div>
          <span className="font-mono shrink-0">Ctrl + K</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
