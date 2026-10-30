import React, { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { useTheme, useKeyboardShortcuts } from './hooks';
import { useViewPreferences } from './hooks/useViewPreferences';
import { useProLicense, ProFeatureKey } from './hooks/useProLicense';
import { usePWAInstall } from './hooks/usePWAInstall';
import { AppHeader, AppFooter, MobileFab } from './components/layout';
import { ToastNotification, UndoSnackbar, ConfettiEffect } from './components/feedback';
import {
  AddProjectBar,
  ActionBar,
  PinnedSection,
  ProjectCard,
  ReminderBanner,
  useTaskManager,
} from './features/tasks';
import { EmergencyRecoveryBanner } from './features/tasks/components/EmergencyRecoveryBanner';
import { isDoingStatus, isDoneStatus } from './features/tasks/utils/statusCategory';
import { FocusBanner, ActiveFocusStrip, useFocusTimer, useFocusLog, FocusLogEvent } from './features/focus';
import { ModalsContainer } from './features/modals';
import type { PaywallTriggerContext } from './features/modals/components/StoreCommercialModal';
import { PAYWALL_ENABLED, COMMERCE_CONFIG } from './config/commerceConfig';
import { useSync } from './features/sync';
import { STORAGE_ERROR_EVENT, StorageErrorReason } from './utils/persistentStorage';
import { useLanguage, formatMessage } from './i18n';
import { WorkspaceViewMode, Task, Project } from './types';
import { triggerHaptic } from './utils';

// Code-splitting: các màn hình nặng chỉ tải khi người dùng mở (giữ chunk khởi động gọn nhẹ)
const StatsPanel = lazy(() =>
  import('./features/analytics/components/StatsPanel').then((m) => ({ default: m.StatsPanel }))
);
const KanbanBoardView = lazy(() =>
  import('./features/tasks/components/KanbanBoardView').then((m) => ({ default: m.KanbanBoardView }))
);
const StoreCommercialModal = lazy(() =>
  import('./features/modals/components/StoreCommercialModal').then((m) => ({ default: m.StoreCommercialModal }))
);
const CommandPaletteModal = lazy(() =>
  import('./features/modals/components/CommandPaletteModal').then((m) => ({ default: m.CommandPaletteModal }))
);
const MarkdownReportModal = lazy(() =>
  import('./features/modals/components/MarkdownReportModal').then((m) => ({ default: m.MarkdownReportModal }))
);
const TaskDetailModal = lazy(() =>
  import('./features/tasks/components/TaskDetailModal').then((m) => ({ default: m.TaskDetailModal }))
);
const SmartScheduleModal = lazy(() =>
  import('./features/tasks/components/SmartScheduleModal').then((m) => ({ default: m.SmartScheduleModal }))
);
const AnkiSrsModal = lazy(() =>
  import('./features/tasks/components/AnkiSrsModal').then((m) => ({ default: m.AnkiSrsModal }))
);
const DailyFocusModal = lazy(() =>
  import('./features/tasks/components/DailyFocusModal').then((m) => ({ default: m.DailyFocusModal }))
);

const SyncModal = lazy(() =>
  import('./features/sync/components/SyncModal').then((m) => ({ default: m.SyncModal }))
);

const ACTIVATE_HASH_PREFIX = '#activate=';
const SYNC_HASH_PREFIX = '#sync=';

export default function App() {
  const { t } = useLanguage();
  const manager = useTaskManager();
  const theme = useTheme();
  const viewPref = useViewPreferences();
  const proLicense = useProLicense({ notify: manager.showToast });
  const pwaInstall = usePWAInstall();
  const focusLog = useFocusLog();

  const [showStoreModal, setShowStoreModal] = useState(false);
  const [paywallTrigger, setPaywallTrigger] = useState<PaywallTriggerContext | null>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showMarkdownReport, setShowMarkdownReport] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncPrefillCode, setSyncPrefillCode] = useState<string | null>(null);

  // Đồng bộ đa thiết bị mã hóa đầu-cuối (PRO). Ẩn hoàn toàn khi chưa cấu hình VITE_SYNC_API_URL
  const canUseSync = proLicense.license.isPro || !PAYWALL_ENABLED;
  const sync = useSync({
    apiUrl: COMMERCE_CONFIG.syncApiUrl,
    licenseToken: proLicense.licenseToken,
    canUse: canUseSync,
    getLocalSnapshot: manager.getSyncSnapshot,
    applySnapshot: manager.applySyncSnapshot,
    isLocalPristine: manager.isSyncPristine,
    changeSignal: [manager.projects, manager.completedLogs, manager.statuses],
  });

  const featureLabels: Record<ProFeatureKey | 'projectLimit', string> = {
    kanban: t.license.featureKanban,
    pomodoro: t.license.featurePomodoro,
    markdownReport: t.license.featureMarkdown,
    projectLimit: t.license.featureProjects,
  };

  // Điểm vào Trung tâm bản quyền chỉ hiện khi paywall bật (hoặc khi đã là PRO để xuất chứng chỉ)
  const openStoreModal =
    PAYWALL_ENABLED || proLicense.license.isPro ? () => setShowStoreModal(true) : undefined;

  const openPaywall = useCallback(
    (featureKey: ProFeatureKey | 'projectLimit', message?: string) => {
      if (message) manager.showToast(message);
      setShowMarkdownReport(false); // modal báo cáo nằm trên lớp cao hơn → đóng trước khi mở paywall
      setPaywallTrigger({ featureKey, featureLabel: featureLabels[featureKey] });
      setShowStoreModal(true);
    },
    [manager.showToast, t]
  );

  /** Trừ 1 lượt dùng thử tại khoảnh khắc người dùng nhận giá trị; hết lượt thì mở paywall và chặn thao tác */
  const guardProValue = useCallback(
    (feature: ProFeatureKey): boolean => {
      const access = proLicense.consumeProFeature(feature);
      if (!access.allowed) {
        openPaywall(feature, access.message);
        return false;
      }
      if (access.message) manager.showToast(access.message);
      return true;
    },
    [proLicense, openPaywall, manager]
  );

  // Ghi phút tập trung: cập nhật quỹ thời gian của việc + focus log lịch sử (Pomodoro miễn phí)
  const handleLogFocusedMinutes = useCallback(
    (event: FocusLogEvent) => {
      manager.addTaskFocusedMinutes(event.projectId, event.taskId, event.minutes, event.completedSession);
      focusLog.recordFocus(event);
    },
    [manager, focusLog, proLicense]
  );

  const focusTimer = useFocusTimer({
    isMuted: manager.isMuted,
    showToast: manager.showToast,
    onLogFocusedMinutes: handleLogFocusedMinutes,
  });

  // Chuyển Danh sách ⇄ Kanban luôn miễn phí (kể cả phím tắt "b"); lượt thử chỉ trừ khi thực sự di chuyển thẻ
  const handleSwitchWorkspaceViewMode = useCallback(
    (nextMode: WorkspaceViewMode) => {
      if (nextMode === viewPref.preferences.workspaceViewMode) return;
      viewPref.setWorkspaceViewMode(nextMode);
    },
    [viewPref]
  );

  const handleStartFocusOnTask = useCallback(
    (task: Task, project: Project) => {
      focusTimer.startFocusForTask(task.id, project.id, task.title, project.name, 'work-25');
      manager.showToast(formatMessage(t.toast.focusStarted, { title: task.title.slice(0, 26) }));
    },
    [proLicense, focusTimer, manager, openPaywall]
  );

  // Mở báo cáo luôn miễn phí (xem trước); lượt thử chỉ trừ khi Sao chép / Tải xuống
  const handleOpenMarkdownReportModal = useCallback(() => {
    setShowMarkdownReport(true);
  }, []);

  // Giới hạn dự án của bản Free (không tính dự án mẫu, có grandfathering cho người dùng cũ)
  const handleGuardedAddProject = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!manager.newProjectName.trim()) return;
      const check = proLicense.checkProjectLimit(manager.projects);
      if (!check.allowed) {
        openPaywall('projectLimit', check.message);
        return;
      }
      manager.handleAddProject(e);
    },
    [manager, proLicense, openPaywall]
  );

  // Khởi động: grandfathering, link kích hoạt 1-click (#activate=) và shortcut PWA (?focus=daily)
  useEffect(() => {
    proLicense.ensureProjectLimitBaseline(manager.projects);

    const { hash, search, pathname } = window.location;
    let nextSearch = search;
    const params = new URLSearchParams(search);
    if (params.get('focus') === 'daily') {
      manager.setShowDailyFocusModal(true);
      params.delete('focus');
      const rest = params.toString();
      nextSearch = rest ? `?${rest}` : '';
    }
    if (nextSearch !== search) {
      window.history.replaceState(null, '', `${pathname}${nextSearch}${hash}`);
    }

    // Link kích hoạt có thể đến lúc tải trang HOẶC khi app đang mở (dán link vào cùng tab chỉ đổi hash)
    const consumeActivationHash = () => {
      const currentHash = window.location.hash;
      if (currentHash.startsWith(SYNC_HASH_PREFIX)) {
        // Link kết nối thiết bị: mở hộp thoại đồng bộ với mã điền sẵn (người dùng tự bấm Kết nối)
        setSyncPrefillCode(decodeURIComponent(currentHash.slice(SYNC_HASH_PREFIX.length)));
        setShowSyncModal(true);
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
        return;
      }
      if (!currentHash.startsWith(ACTIVATE_HASH_PREFIX)) return;
      const token = currentHash.slice(ACTIVATE_HASH_PREFIX.length);
      // Xóa token khỏi thanh địa chỉ để không lộ qua lịch sử trình duyệt hay ảnh chụp màn hình
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
      proLicense.activateWithToken(token).then((result) => manager.showToast(result.message));
    };
    consumeActivationHash();
    window.addEventListener('hashchange', consumeActivationHash);
    return () => window.removeEventListener('hashchange', consumeActivationHash);
  }, []);

  // Cảnh báo rõ ràng khi trình duyệt không lưu được dữ liệu (hết quota / chế độ ẩn danh chặn storage)
  useEffect(() => {
    const onStorageError = (e: Event) => {
      const reason = (e as CustomEvent<{ reason: StorageErrorReason }>).detail?.reason;
      manager.showToast(reason === 'quota' ? t.storage.quotaExceeded : t.storage.blocked);
    };
    window.addEventListener(STORAGE_ERROR_EVENT, onStorageError);
    return () => window.removeEventListener(STORAGE_ERROR_EVENT, onStorageError);
  }, [t]);

  useKeyboardShortcuts({
    isFocusMode: manager.isFocusMode,
    setIsFocusMode: manager.setIsFocusMode,
    showMobileAddModal: manager.showMobileAddModal,
    setShowMobileAddModal: manager.setShowMobileAddModal,
    showGuideModal: manager.showGuideModal,
    setShowGuideModal: manager.setShowGuideModal,
    showBackupModal: manager.showBackupModal,
    setShowBackupModal: manager.setShowBackupModal,
    showMobileGuideModal: manager.showMobileGuideModal,
    setShowMobileGuideModal: manager.setShowMobileGuideModal,
    activeMenuTaskId: manager.activeMenuTaskId,
    setActiveMenuTaskId: manager.setActiveMenuTaskId,
    batchPasteProject: manager.batchPasteProject,
    setBatchPasteProject: manager.setBatchPasteProject,
    search: manager.search,
    setSearch: manager.setSearch,
    setMobileSearchOpen: manager.setMobileSearchOpen,
    undoState: manager.undoState,
    setUndoState: manager.setUndoState,
    desktopSearchRef: manager.desktopSearchRef,
    onCycleTheme: theme.cycleTheme,
    onOpenCommandPalette: () => setShowCommandPalette((prev) => !prev),
    onToggleBoardView: () =>
      handleSwitchWorkspaceViewMode(
        viewPref.preferences.workspaceViewMode === 'list' ? 'board' : 'list'
      ),
  });

  const handleToggleHideCompletedInAll = () => {
    const willHide = !viewPref.preferences.hideCompletedInAllView;
    viewPref.toggleHideCompletedInAll();
    manager.showToast(willHide ? t.toast.completedHidden : t.toast.completedShown);
  };

  const isBoardMode = viewPref.preferences.workspaceViewMode === 'board';

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#f8f9fa] dark:bg-[#0b0f17] text-[#212529] dark:text-[#f1f5f9] font-sans antialiased selection:bg-slate-200 dark:selection:bg-slate-700 transition-colors">
      <input type="file" ref={manager.fileInputRef} onChange={manager.importDataJson} accept=".json" className="hidden" />

      {/* Thanh đầu trang */}
      <AppHeader
        totalTasks={manager.totalTasks}
        totalDone={manager.totalDone}
        streak={manager.streak}
        isFocusMode={manager.isFocusMode}
        onToggleFocusMode={() => manager.setIsFocusMode(!manager.isFocusMode)}
        reminderEnabled={manager.reminder.reminderEnabled}
        onToggleReminder={manager.reminder.toggleReminder}
        showStats={manager.showStats}
        onToggleStats={() => manager.setShowStats(!manager.showStats)}
        onOpenBackupModal={() => manager.setShowBackupModal(true)}
        onOpenMobileGuideModal={() => manager.setShowMobileGuideModal(true)}
        onOpenFeedback={() => manager.setShowFeedbackModal(true)}
        onOpenViewSettings={() => manager.setShowViewSettingsModal(true)}
        viewPreferences={viewPref.preferences}
        onToggleZenMode={viewPref.toggleZenMode}
        isMuted={manager.isMuted}
        onToggleMute={manager.toggleMute}
        onOpenGuideModal={() => manager.setShowGuideModal(true)}
        onDownloadHtml={manager.downloadHtml}
        themeMode={theme.themeMode}
        onCycleTheme={theme.cycleTheme}
        onClearSampleData={manager.clearSampleData}
        onResetSample={manager.resetSample}
        isPro={proLicense.license.isPro}
        onOpenStoreModal={openStoreModal}
        canInstallPWA={pwaInstall.canInstall}
        onInstallPWA={() => {
          pwaInstall.install();
        }}
        onOpenCommandPalette={() => setShowCommandPalette(true)}
        onOpenMarkdownReport={handleOpenMarkdownReportModal}
        onOpenSync={sync.available ? () => setShowSyncModal(true) : undefined}
        syncState={sync.enabled ? (sync.status === 'error' ? 'error' : 'on') : 'off'}
      />

      {/* Nội dung tập trung Core - Tự động mở rộng max-w-6xl khi bật Bảng Kanban 4 cột */}
      <main
        className={`${
          isBoardMode ? 'max-w-6xl' : 'max-w-2xl'
        } w-full mx-auto px-2.5 sm:px-4 py-3.5 sm:py-4 pb-24 sm:pb-10 space-y-3 overflow-x-hidden min-w-0 transition-all`}
      >
        {/* Thanh Đồng hồ Tập trung Focus Pomodoro (Non-blocking Active Focus Strip) */}
        <ActiveFocusStrip
          session={focusTimer.session}
          onTogglePauseResume={focusTimer.togglePauseResume}
          onSwitchPreset={focusTimer.switchPresetMode}
          onAddFiveMinutes={focusTimer.addFiveMinutes}
          onCompleteTaskNow={(projId, taskId) => {
            focusTimer.stopAndLogElapsed();
            manager.toggleTaskDone(projId, taskId, true);
          }}
          onStopSession={focusTimer.stopAndLogElapsed}
          onOpenTaskDetail={(taskId, projId) => {
            const p = manager.projects.find((item) => item.id === projId);
            const t = p?.tasks.find((item) => item.id === taskId);
            if (p && t) {
              manager.openDetailModal(t, p.id);
            }
          }}
        />

        {/* Bản đồ nhịp độ (Heatmap & Bảng xóa/sửa lịch sử) */}
        {viewPref.preferences.showStatsPanel && !viewPref.preferences.zenMode && manager.showStats && (
          <Suspense fallback={null}>
          <StatsPanel
            isOpen={manager.showStats}
            onClose={() => manager.setShowStats(false)}
            projects={manager.projects}
            focusSummary={focusLog.summary}
            completedLogs={manager.completedLogs}
            activityMap={manager.activityMap}
            todayCount={manager.todayCount}
            weekCount={manager.weekCount}
            currentStreak={manager.currentStreak}
            totalCompleted={manager.totalCompleted}
            showToast={manager.showToast}
            onDeleteLog={(id) => {
              manager.deleteActivityLog(id);
              manager.showToast(t.toast.logDeleted);
            }}
            onClearAllLogs={() => {
              manager.clearAllActivityLogs();
              manager.showToast(t.toast.logsCleared);
            }}
            onResetSeed={() => {
              manager.resetSeedActivityLogs();
              manager.showToast(t.toast.logsSeedRestored);
            }}
          />
          </Suspense>
        )}

        {/* Thanh thêm dự án nhanh (ẩn được theo setting) */}
        {viewPref.preferences.showAddProjectBar && !viewPref.preferences.zenMode && (
          <AddProjectBar
            projectName={manager.newProjectName}
            onChange={manager.setNewProjectName}
            onSubmit={handleGuardedAddProject}
          />
        )}

        {/* Cảnh báo khôi phục khẩn cấp nếu phát hiện dữ liệu cũ */}
        <EmergencyRecoveryBanner
          currentProjects={manager.projects}
          onRestore={manager.handleRestoreSnapshot}
          onOpenBackupModal={() => manager.setShowBackupModal(true)}
          onClearSampleData={manager.clearSampleData}
        />

        {/* Thanh lọc & tìm kiếm */}
        <ActionBar
          filter={manager.filter}
          onFilterChange={manager.setFilter}
          totalDoing={manager.totalDoing}
          totalScheduled={manager.totalScheduled}
          search={manager.search}
          onSearchChange={manager.setSearch}
          mobileSearchOpen={manager.mobileSearchOpen}
          onOpenMobileSearch={() => {
            manager.setMobileSearchOpen(true);
            setTimeout(() => manager.mobileSearchRef.current?.focus(), 60);
          }}
          onCloseMobileSearch={() => {
            manager.setMobileSearchOpen(false);
            manager.setSearch('');
          }}
          onResetSample={manager.resetSample}
          desktopSearchRef={manager.desktopSearchRef}
          mobileSearchRef={manager.mobileSearchRef}
          showFilterTabs={viewPref.preferences.showFilterTabs && !viewPref.preferences.zenMode}
          hideCompletedInAllView={viewPref.preferences.hideCompletedInAllView}
          onToggleHideCompletedInAll={handleToggleHideCompletedInAll}
          hiddenDoneCount={manager.totalDone}
          dailyFocusCount={manager.dailyFocusQueue.length}
          onOpenDailyFocus={() => manager.setShowDailyFocusModal(true)}
          workspaceViewMode={viewPref.preferences.workspaceViewMode}
          onWorkspaceViewModeChange={handleSwitchWorkspaceViewMode}
          onOpenCommandPalette={() => setShowCommandPalette(true)}
        />

        <FocusBanner
          isFocusMode={manager.isFocusMode}
          uncompletedCount={manager.uncompletedCount}
          onExitFocusMode={() => manager.setIsFocusMode(false)}
        />

        <PinnedSection
          pinnedTasks={manager.pinnedTasks}
          expandedTaskId={manager.expandedTaskId}
          onToggleExpand={(id) => manager.setExpandedTaskId(manager.expandedTaskId === id ? null : id)}
          onToggleTaskDone={manager.toggleTaskDone}
          onToggleSubTask={manager.toggleSubTask}
          onChangeStatus={manager.changeStatus}
          onTogglePinTask={manager.togglePinTask}
          onTogglePinSubTask={manager.togglePinSubTask}
          onEditTaskTitle={manager.handleEditTaskTitle}
          onEditSubtaskTitle={manager.handleEditSubtaskTitle}
          onAddSubTask={manager.handleAddSubTask}
          onDeleteSubTask={manager.handleDeleteSubTask}
          onOpenDetail={manager.openDetailModal}
          onOpenSchedule={(task, project) => manager.openScheduleModal(task, project)}
          onOpenAnkiSrs={manager.openAnkiModalForTask}
          onStartFocusTask={handleStartFocusOnTask}
          activeFocusTaskId={focusTimer.session?.taskId || null}
          onChangeSubtaskStatus={manager.changeSubtaskStatus}
          statuses={manager.statuses}
        />

        {/* Chế độ Bảng Kanban 4 cột chuẩn Linear HOẶC Danh sách Dự án & Checklist */}
        {isBoardMode ? (
          <Suspense
            fallback={<div className="h-40 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 animate-pulse" />}
          >
          <KanbanBoardView
            projects={manager.projects}
            statuses={manager.statuses}
            search={manager.search}
            onChangeStatus={manager.changeStatus}
            onToggleTaskDone={manager.toggleTaskDone}
            onTogglePinTask={manager.togglePinTask}
            onOpenDetail={manager.openDetailModal}
            onOpenAnkiSrs={(task, projId) => manager.openAnkiModalForTask(task, projId)}
            onStartFocusTask={handleStartFocusOnTask}
            onQuickAddTaskToColumn={manager.handleQuickAddTaskToColumn}
            activeFocusTaskId={focusTimer.session?.taskId || null}
          />
          </Suspense>
        ) : (
          <div className="space-y-2.5">
            {manager.filteredProjects.length === 0 ? (
              <div className="bg-white dark:bg-[#161b22] rounded-xl p-8 text-center border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-2">
                {manager.projects.length === 0 ? (
                  <>
                    <p className="font-medium text-slate-700 dark:text-slate-300">Không gian làm việc đang trống</p>
                    <p className="text-[11.5px] text-slate-400 dark:text-slate-500">
                      Bạn có thể tạo dự án mới ở ô nhập bên trên hoặc mở menu để khôi phục dữ liệu mẫu bất kỳ lúc nào.
                    </p>
                  </>
                ) : (
                  <p>Không có công việc nào phù hợp với bộ lọc hoặc từ khóa tìm kiếm.</p>
                )}
              </div>
            ) : (
              manager.filteredProjects.map((p, idx) => {
                const visibleTasks = p.tasks.filter((t) => {
                  if (manager.search.trim()) {
                    // Đã lọc deep bằng matchTaskDeep ở useTaskManager -> Hiện TẤT CẢ khi tìm kiếm kể cả việc đã làm!
                    return true;
                  }
                  if (manager.isFocusMode || manager.filter === 'doing') {
                    return isDoingStatus(t.status, manager.statuses);
                  }
                  if (manager.filter === 'completed') {
                    return isDoneStatus(t.status, manager.statuses);
                  }
                  if (manager.filter === 'all' && viewPref.preferences.hideCompletedInAllView) {
                    return !isDoneStatus(t.status, manager.statuses);
                  }
                  return true;
                });

                return (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    visibleTasks={visibleTasks}
                    search={manager.search}
                    filter={manager.filter}
                    isFocusMode={manager.isFocusMode}
                    hideCompletedInAllView={viewPref.preferences.hideCompletedInAllView}
                    onToggleHideCompletedInAll={handleToggleHideCompletedInAll}
                    onToggleExpand={manager.toggleExpand}
                    onCopyProjectAsMarkdown={manager.copyProjectAsMarkdown}
                    onOpenBatchPaste={manager.openBatchPasteForProject}
                    onOpenBatchPasteForTask={(projId, taskId, parentSubId, targetTitle) => {
                      const targetProj = manager.projects.find((item) => item.id === projId);
                      const targetTask = targetProj?.tasks.find((item) => item.id === taskId);
                      if (targetProj && targetTask) {
                        manager.openBatchPasteForTask(targetProj, targetTask, parentSubId ?? undefined, targetTitle);
                      }
                    }}
                    onDeleteProject={manager.handleDeleteProject}
                    onEditProjectName={manager.handleEditProjectName}
                    onEditTaskTitle={manager.handleEditTaskTitle}
                    onEditSubtaskTitle={manager.handleEditSubtaskTitle}
                    taskInputValue={manager.taskInputs[p.id] || ''}
                    onTaskInputChange={(projId, val) => manager.setTaskInputs((prev) => ({ ...prev, [projId]: val }))}
                    onAddTask={(projId, e) => manager.handleAddTask(projId, e)}
                    onTaskInputPaste={manager.handleTaskInputPaste}
                    draggedItem={manager.draggedItem}
                    dragOverItem={manager.dragOverItem}
                    onDragStart={manager.handleDragStart}
                    onDragOver={manager.handleDragOver}
                    onDrop={manager.handleDrop}
                    onDragEnd={manager.handleDragEnd}
                    expandedTaskId={manager.expandedTaskId}
                    onToggleExpandTask={manager.setExpandedTaskId}
                    onToggleTaskDone={manager.toggleTaskDone}
                    onChangeStatus={manager.changeStatus}
                    statuses={manager.statuses}
                    onAddCustomStatus={manager.addCustomStatus}
                    onDeleteCustomStatus={manager.deleteCustomStatus}
                    onChangeSubtaskStatus={manager.changeSubtaskStatus}
                    activeMenuTaskId={manager.activeMenuTaskId}
                    onSetActiveMenuTaskId={manager.setActiveMenuTaskId}
                    onCopyTask={manager.copyTaskToClipboard}
                    onTogglePinTask={manager.togglePinTask}
                    onOpenAddSubtask={manager.openAddSubtask}
                    onMoveTask={manager.moveTask}
                    onDeleteTask={manager.handleDeleteTask}
                    expandedSubtasks={manager.expandedSubtasks}
                    onToggleExpandSubtasks={manager.toggleExpandSubtasks}
                    activeSubTaskId={manager.activeSubTaskId}
                    subtaskFilterMap={manager.subtaskFilterMap}
                    onSubtaskFilterModeChange={manager.handleSubtaskFilterModeChange}
                    showCompletedSubs={manager.showCompletedSubs}
                    onToggleCompletedSubExpanded={manager.toggleCompletedSubExpanded}
                    showAllActiveSubs={manager.showAllActiveSubs}
                    onToggleShowAllActiveSubs={manager.toggleShowAllActiveSubs}
                    expandedSubTaskId={manager.expandedSubTaskId}
                    onToggleExpandedSubTaskId={manager.setExpandedSubTaskId}
                    onToggleSubTask={manager.toggleSubTask}
                    onDeleteSubTask={manager.handleDeleteSubTask}
                    subInputs={manager.subInputs}
                    onSubInputChange={(taskId, val) => manager.setSubInputs((prev) => ({ ...prev, [taskId]: val }))}
                    onAddSubTask={(projId, taskId, title, parentSubId) => manager.handleAddSubTask(projId, taskId, title, parentSubId)}
                    onCloseSubtaskInput={() => manager.setActiveSubTaskId(null)}
                    onReorderSubtask={manager.handleReorderSubtask}
                    onSetTaskRecurrence={manager.handleSetTaskRecurrence}
                    onSetSubTaskRecurrence={manager.handleSetSubTaskRecurrence}
                    onManuallyResetRecurring={manager.handleManuallyResetRecurring}
                    onManuallyResetRecurringSubTask={manager.handleManuallyResetRecurringSubTask}
                    onOpenDetail={manager.openDetailModal}
                    onOpenSchedule={(task) => manager.openScheduleModal(task, p)}
                    onTogglePinSubTask={manager.togglePinSubTask}
                    onOpenAnkiSrs={manager.openAnkiModalForTask}
                    onStartFocusTask={handleStartFocusOnTask}
                    activeFocusTaskId={focusTimer.session?.taskId || null}
                    onMoveProject={manager.moveProject}
                    isFirstProject={idx === 0}
                    isLastProject={idx === manager.filteredProjects.length - 1}
                    isProjectDragging={manager.draggedProjId === p.id}
                    isProjectOver={manager.dragOverProj?.projId === p.id}
                    dragOverProjectPosition={manager.dragOverProj?.projId === p.id ? manager.dragOverProj.position : null}
                    onProjectDragStart={manager.handleProjectDragStart}
                    onProjectDragOver={manager.handleProjectDragOver}
                    onProjectDrop={manager.handleProjectDrop}
                    onProjectDragEnd={manager.handleProjectDragEnd}
                  />
                );
              })
            )}
          </div>
        )}

        <AppFooter
          onOpenMobileGuide={() => manager.setShowMobileGuideModal(true)}
          onOpenGuide={() => manager.setShowGuideModal(true)}
          onOpenBackup={() => manager.setShowBackupModal(true)}
          onOpenFeedback={() => manager.setShowFeedbackModal(true)}
          onOpenStoreModal={openStoreModal}
          themeMode={theme.themeMode}
          onSetThemeMode={theme.setThemeMode}
        />
      </main>

      <MobileFab
        onClick={() => {
          triggerHaptic();
          manager.setMobileSelectedProjId(manager.projects[0]?.id || '');
          manager.setShowMobileAddModal(true);
        }}
      />

      {/* Thông báo nhắc việc liên tục trong ứng dụng */}
      <ReminderBanner
        banner={manager.reminder.inAppBanner}
        onDismiss={manager.reminder.dismissBanner}
        onReviewTask={() => {
          manager.setShowDailyFocusModal(true);
        }}
      />

      <ToastNotification message={manager.toast} isVisible={Boolean(manager.toast && !manager.undoState)} />
      <UndoSnackbar undoState={manager.undoState} onDismiss={() => manager.setUndoState(null)} />
      {manager.showConfetti && <ConfettiEffect />}

      <ModalsContainer
        confirmDialog={manager.confirmDialog}
        onCloseConfirmDialog={() => manager.setConfirmDialog(null)}
        batchPasteProject={manager.batchPasteProject}
        batchPasteText={manager.batchPasteText}
        onBatchPasteTextChange={manager.setBatchPasteText}
        onCloseBatchPaste={() => manager.setBatchPasteProject(null)}
        onExecuteBatchPaste={manager.handleExecuteBatchPaste}
        showMobileAddModal={manager.showMobileAddModal}
        projects={manager.projects}
        mobileSelectedProjId={manager.mobileSelectedProjId}
        onMobileSelectedProjIdChange={manager.setMobileSelectedProjId}
        mobileTaskTitle={manager.mobileTaskTitle}
        onMobileTaskTitleChange={manager.setMobileTaskTitle}
        mobileTaskPinned={manager.mobileTaskPinned}
        onMobileTaskPinnedChange={manager.setMobileTaskPinned}
        onCloseMobileAddModal={() => manager.setShowMobileAddModal(false)}
        onSubmitMobileTask={manager.handleMobileSubmitTask}
        showMobileGuideModal={manager.showMobileGuideModal}
        mobileGuideTab={manager.mobileGuideTab}
        onMobileGuideTabChange={manager.setMobileGuideTab}
        onCloseMobileGuideModal={() => manager.setShowMobileGuideModal(false)}
        showGuideModal={manager.showGuideModal}
        onCloseGuideModal={() => manager.setShowGuideModal(false)}
        showBackupModal={manager.showBackupModal}
        onCloseBackupModal={() => manager.setShowBackupModal(false)}
        onExportBackup={manager.exportDataJson}
        onTriggerImportBackup={() => manager.fileInputRef.current?.click()}
        onResetSampleBackup={manager.resetSample}
        autoBackupData={manager.autoBackupData}
        onRestoreAutoBackup={manager.restoreAutoBackup}
        onClearAllData={manager.clearAllData}
        onRestoreSnapshot={manager.handleRestoreSnapshot}
        onDirectPasteRestore={manager.handleDirectPasteRestore}
        onGetFullBackupJson={manager.getFullBackupJsonString}
        onDownloadHtml={manager.downloadHtml}
        showFeedbackModal={manager.showFeedbackModal}
        onCloseFeedbackModal={() => manager.setShowFeedbackModal(false)}
        showViewSettingsModal={manager.showViewSettingsModal}
        onCloseViewSettingsModal={() => manager.setShowViewSettingsModal(false)}
        viewPreferences={viewPref.preferences}
        onUpdateViewPreference={viewPref.updatePreference}
        onToggleZenMode={viewPref.toggleZenMode}
        onResetViewPreferences={viewPref.resetPreferences}
        totalTasksCount={manager.totalTasks}
        showToast={manager.showToast}
      />

      {/* Các modal nặng được tải theo yêu cầu (React.lazy), chỉ mount khi người dùng thực sự mở */}
      <Suspense fallback={null}>
      {/* Modal xem & chỉnh sửa toàn diện chi tiết công việc */}
      {manager.selectedDetailTask && (
      <TaskDetailModal
        isOpen={Boolean(manager.selectedDetailTask)}
        onClose={manager.closeDetailModal}
        task={manager.selectedDetailTask?.task || null}
        project={manager.selectedDetailTask?.project || null}
        statuses={manager.statuses}
        onSaveTitle={manager.handleEditTaskTitle}
        onChangeStatus={manager.changeStatus}
        onToggleTaskDone={manager.toggleTaskDone}
        onTogglePinTask={manager.togglePinTask}
        onDeleteTask={manager.handleDeleteTask}
        onSetRecurrence={manager.handleSetTaskRecurrence}
        onManuallyResetRecurring={manager.handleManuallyResetRecurring}
        onToggleSubTask={manager.toggleSubTask}
        onAddSubTask={manager.handleAddSubTask}
        onDeleteSubTask={manager.handleDeleteSubTask}
        onEditSubtaskTitle={manager.handleEditSubtaskTitle}
        onOpenSchedule={(task) => {
          if (manager.selectedDetailTask) {
            manager.openScheduleModal(task, manager.selectedDetailTask.project);
          }
        }}
        onOpenAnkiSrs={manager.openAnkiModalForTask}
        onStartFocusTask={handleStartFocusOnTask}
        onSetEstimatedMinutes={manager.setTaskEstimatedMinutes}
      />
      )}

      {/* Modal Lên lịch nhắc thông minh */}
      {manager.scheduleTaskTarget && (
      <SmartScheduleModal
        isOpen={Boolean(manager.scheduleTaskTarget)}
        onClose={manager.closeScheduleModal}
        task={manager.scheduleTaskTarget?.task || null}
        projectName={manager.scheduleTaskTarget?.project?.name}
        allProjects={manager.projects}
        onSaveSchedule={(schedule) => {
          if (manager.scheduleTaskTarget) {
            manager.handleSetTaskSchedule(
              manager.scheduleTaskTarget.project.id,
              manager.scheduleTaskTarget.task.id,
              schedule
            );
          }
        }}
        onSelectAnkiSrs={(option, targetIso) => {
          if (manager.scheduleTaskTarget) {
            manager.handleSelectAnkiOption(
              {
                projectId: manager.scheduleTaskTarget.project.id,
                projectName: manager.scheduleTaskTarget.project.name,
                taskId: manager.scheduleTaskTarget.task.id,
                title: manager.scheduleTaskTarget.task.title,
                currentLevel: manager.scheduleTaskTarget.task.snoozeLevel || 1,
                snoozeUntil: manager.scheduleTaskTarget.task.snoozeUntil,
                isPinned: manager.scheduleTaskTarget.task.isPinned,
                isNewTask: false,
              },
              option,
              targetIso
            );
          }
        }}
      />
      )}

      {/* Modal Tiêu điểm giải quyết quá tải việc */}
      {manager.showDailyFocusModal && (
      <DailyFocusModal
        isOpen={manager.showDailyFocusModal}
        onClose={() => manager.setShowDailyFocusModal(false)}
        items={manager.dailyFocusQueue}
        snoozedItems={manager.snoozedFocusQueue}
        projects={manager.projects}
        onToggleTaskDone={manager.toggleTaskDone}
        onToggleSubTask={manager.toggleSubTask}
        onTogglePinTask={(projId, taskId) => {
          manager.togglePinTask(projId, taskId, { stopPropagation: () => {} } as any);
        }}
        onTogglePinSubTask={manager.togglePinSubTask}
        onSnoozeTask={manager.handleSnoozeTask}
        onSnoozeSubTask={manager.handleSnoozeSubTask}
        onOpenDetail={(taskId, projId) => {
          const p = manager.projects.find((item) => item.id === projId);
          const t = p?.tasks.find((item) => item.id === taskId);
          if (p && t) {
            manager.openDetailModal(t, p.id);
          }
        }}
        onStartFocusItem={(item) => {
          const p = manager.projects.find((proj) => proj.id === item.projectId);
          const t = p?.tasks.find((task) => task.id === item.taskId);
          if (p && t) {
            manager.setShowDailyFocusModal(false);
            handleStartFocusOnTask(t, p);
          }
        }}
        onExecuteShutdownRitual={manager.executeDailyShutdownRitual}
        onOpenMarkdownReport={handleOpenMarkdownReportModal}
      />
      )}

      {/* Modal Lặp lại ngắt quãng thông minh (Anki SRS) */}
      {manager.isAnkiModalOpen && (
      <AnkiSrsModal
        isOpen={manager.isAnkiModalOpen}
        onClose={manager.closeAnkiModal}
        target={manager.ankiModalTarget}
        onSelectSrsOption={manager.handleSelectAnkiOption}
        onMarkTaskDone={manager.handleMarkAnkiTaskDone}
      />
      )}
      </Suspense>

      {/* Các hộp thoại nặng được tải theo yêu cầu (React.lazy) */}
      <Suspense fallback={null}>
      {/* Hộp thoại Thanh Lệnh Nhanh Ctrl+K (Linear & Godspeed Command Palette) */}
      {showCommandPalette && (
      <CommandPaletteModal
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        projects={manager.projects}
        workspaceViewMode={viewPref.preferences.workspaceViewMode}
        onSwitchViewMode={handleSwitchWorkspaceViewMode}
        onOpenDailyFocus={() => manager.setShowDailyFocusModal(true)}
        onOpenMarkdownReport={handleOpenMarkdownReportModal}
        onOpenStoreModal={openStoreModal}
        onToggleZenMode={viewPref.toggleZenMode}
        onToggleStats={() => {
          viewPref.updatePreference('showStatsPanel', true);
          manager.setShowStats(true);
        }}
        onCycleTheme={theme.cycleTheme}
        onExportBackupJson={manager.exportDataJson}
        onOpenTaskDetail={manager.openDetailModal}
        onStartFocusTask={handleStartFocusOnTask}
        onToggleTaskDone={manager.toggleTaskDone}
        onOpenAnkiSrs={(task, projId) => manager.openAnkiModalForTask(task, projId)}
        onQuickCreateTask={(projId, title) => {
          manager.handleQuickAddTaskToColumn(projId, title, 'todo');
        }}
      />
      )}

      {/* Hộp thoại Xuất Báo cáo Tiến độ Markdown (Obsidian / Notion / Daily Standup) */}
      {showMarkdownReport && (
      <MarkdownReportModal
        isOpen={showMarkdownReport}
        onClose={() => setShowMarkdownReport(false)}
        projects={manager.projects}
        statuses={manager.statuses}
        completedLogs={manager.completedLogs}
        streak={manager.streak}
        todayCount={manager.todayCount}
        weekCount={manager.weekCount}
        showToast={manager.showToast}
        onBeforeExport={() => guardProValue('markdownReport')}
      />
      )}

      {/* Trung tâm bản quyền PRO trọn đời (Ed25519 + giá theo khu vực) */}
      {showStoreModal && (
      <StoreCommercialModal
        isOpen={showStoreModal}
        onClose={() => {
          setShowStoreModal(false);
          setPaywallTrigger(null);
        }}
        triggerContext={paywallTrigger}
        pro={proLicense}
        projects={manager.projects}
        showToast={manager.showToast}
      />
      )}

      {/* Đồng bộ đa thiết bị mã hóa đầu-cuối */}
      {showSyncModal && sync.available && (
      <SyncModal
        isOpen={showSyncModal}
        onClose={() => {
          setShowSyncModal(false);
          setSyncPrefillCode(null);
        }}
        sync={sync}
        canUse={canUseSync}
        prefillCode={syncPrefillCode}
        onOpenUpgrade={
          openStoreModal
            ? () => {
                setShowSyncModal(false);
                openStoreModal();
              }
            : undefined
        }
        showToast={manager.showToast}
      />
      )}
      </Suspense>
    </div>
  );
}
