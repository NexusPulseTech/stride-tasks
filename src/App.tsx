import React from 'react';
import { useTheme, useKeyboardShortcuts } from './hooks';
import { useViewPreferences } from './hooks/useViewPreferences';
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
import { TaskDetailModal } from './features/tasks/components/TaskDetailModal';
import { SmartScheduleModal } from './features/tasks/components/SmartScheduleModal';
import { EmergencyRecoveryBanner } from './features/tasks/components/EmergencyRecoveryBanner';
import { isDoingStatus, isDoneStatus } from './features/tasks/utils/statusCategory';
import { FocusBanner } from './features/focus';
import { StatsPanel } from './features/analytics';
import { ModalsContainer } from './features/modals';
import { triggerHaptic } from './utils';

export default function App() {
  const manager = useTaskManager();
  const theme = useTheme();
  const viewPref = useViewPreferences();

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
  });

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
        onDownloadSourceZip={manager.downloadSourceZip}
        themeMode={theme.themeMode}
        onCycleTheme={theme.cycleTheme}
        onClearSampleData={manager.clearSampleData}
        onResetSample={manager.resetSample}
      />

      {/* Nội dung tập trung Core */}
      <main className="max-w-2xl w-full mx-auto px-3.5 sm:px-4 py-4 pb-24 sm:pb-10 space-y-3.5 overflow-x-hidden min-w-0">
        {/* Bản đồ nhịp độ (Heatmap & Bảng xóa/sửa lịch sử) */}
        {viewPref.preferences.showStatsPanel && !viewPref.preferences.zenMode && (
          <StatsPanel
            isOpen={manager.showStats}
            onClose={() => manager.setShowStats(false)}
            completedLogs={manager.completedLogs}
            activityMap={manager.activityMap}
            todayCount={manager.todayCount}
            weekCount={manager.weekCount}
            currentStreak={manager.currentStreak}
            totalCompleted={manager.totalCompleted}
            showToast={manager.showToast}
            onDeleteLog={(id) => {
              manager.deleteActivityLog(id);
              manager.showToast('Đã xóa bản ghi lịch sử');
            }}
            onClearAllLogs={() => {
              manager.clearAllActivityLogs();
              manager.showToast('Đã dọn sạch toàn bộ lịch sử hoàn thành');
            }}
            onResetSeed={() => {
              manager.resetSeedActivityLogs();
              manager.showToast('Đã khôi phục dữ liệu mẫu lịch sử');
            }}
          />
        )}

        {/* Thanh thêm dự án nhanh (ẩn được theo setting) */}
        {viewPref.preferences.showAddProjectBar && !viewPref.preferences.zenMode && (
          <AddProjectBar
            projectName={manager.newProjectName}
            onChange={manager.setNewProjectName}
            onSubmit={manager.handleAddProject}
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
          statuses={manager.statuses}
        />

        {/* Danh sách Dự án & Checklist */}
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
                  // Đã lọc deep bằng matchTaskDeep ở useTaskManager
                  return true;
                }
                if (manager.isFocusMode || manager.filter === 'doing') {
                  return isDoingStatus(t.status, manager.statuses);
                }
                if (manager.filter === 'completed') {
                  return isDoneStatus(t.status, manager.statuses);
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

        <AppFooter
          onOpenMobileGuide={() => manager.setShowMobileGuideModal(true)}
          onOpenGuide={() => manager.setShowGuideModal(true)}
          onOpenBackup={() => manager.setShowBackupModal(true)}
          onOpenFeedback={() => manager.setShowFeedbackModal(true)}
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
        onDownloadSourceZip={manager.downloadSourceZip}
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

      {/* Modal xem & chỉnh sửa toàn diện chi tiết công việc (Không che giấu Text) */}
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
      />

      {/* Modal Lên lịch nhắc thông minh (Linear / Things 3 / Apple Reminders Assistant) */}
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
      />
    </div>
  );
}
