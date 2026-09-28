import React from 'react';
import { useTheme, useKeyboardShortcuts } from './hooks';
import { AppHeader, AppFooter, MobileFab } from './components/layout';
import { ToastNotification, UndoSnackbar, ConfettiEffect } from './components/feedback';
import {
  AddProjectBar,
  ActionBar,
  PinnedSection,
  ProjectCard,
  useTaskManager,
} from './features/tasks';
import { FocusBanner } from './features/focus';
import { StatsPanel } from './features/analytics';
import { ModalsContainer } from './features/modals';
import { triggerHaptic } from './utils';

export default function App() {
  const manager = useTaskManager();
  const theme = useTheme();

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
        reminderEnabled={manager.reminderEnabled}
        onToggleReminder={manager.toggleReminder}
        showStats={manager.showStats}
        onToggleStats={() => manager.setShowStats(!manager.showStats)}
        onOpenBackupModal={() => manager.setShowBackupModal(true)}
        onOpenMobileGuideModal={() => manager.setShowMobileGuideModal(true)}
        onOpenFeedback={() => manager.setShowFeedbackModal(true)}
        isMuted={manager.isMuted}
        onToggleMute={manager.toggleMute}
        onOpenGuideModal={() => manager.setShowGuideModal(true)}
        onDownloadHtml={manager.downloadHtml}
        themeMode={theme.themeMode}
        onCycleTheme={theme.cycleTheme}
      />

      {/* Nội dung tập trung Core */}
      <main className="max-w-2xl w-full mx-auto px-3.5 sm:px-4 py-4 pb-24 sm:pb-10 space-y-3.5 overflow-x-hidden min-w-0">
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
        />

        <AddProjectBar
          projectName={manager.newProjectName}
          onChange={manager.setNewProjectName}
          onSubmit={manager.handleAddProject}
        />

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
          onChangeStatus={manager.changeStatus}
          onTogglePinTask={manager.togglePinTask}
          onEditTaskTitle={manager.handleEditTaskTitle}
        />

        {/* Danh sách Dự án & Checklist */}
        <div className="space-y-2.5">
          {manager.filteredProjects.length === 0 ? (
            <div className="bg-white dark:bg-[#161b22] rounded-xl p-8 text-center border border-slate-200/80 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500">
              Không có công việc nào phù hợp.
            </div>
          ) : (
            manager.filteredProjects.map((p) => {
              const visibleTasks = p.tasks.filter((t) => {
                if (manager.search.trim()) {
                  const q = manager.search.toLowerCase();
                  const match = t.title.toLowerCase().includes(q) || (t.subtasks && t.subtasks.some((s) => s.title.toLowerCase().includes(q)));
                  if (!match) return false;
                }
                if (manager.isFocusMode || manager.filter === 'doing') return t.status !== 'done';
                if (manager.filter === 'completed') return t.status === 'done';
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
                  onOpenBatchPaste={(project) => {
                    manager.setBatchPasteProject(project);
                    manager.setBatchPasteText('');
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
        showFeedbackModal={manager.showFeedbackModal}
        onCloseFeedbackModal={() => manager.setShowFeedbackModal(false)}
        totalTasksCount={manager.totalTasks}
        showToast={manager.showToast}
      />
    </div>
  );
}
