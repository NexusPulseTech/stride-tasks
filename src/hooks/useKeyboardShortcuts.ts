import { useEffect } from 'react';
import { UndoAction } from '../types';

interface KeyboardShortcutsProps {
  isFocusMode: boolean;
  setIsFocusMode: React.Dispatch<React.SetStateAction<boolean>>;
  showMobileAddModal: boolean;
  setShowMobileAddModal: (val: boolean) => void;
  showGuideModal: boolean;
  setShowGuideModal: (val: boolean) => void;
  showBackupModal: boolean;
  setShowBackupModal: (val: boolean) => void;
  showMobileGuideModal: boolean;
  setShowMobileGuideModal: (val: boolean) => void;
  activeMenuTaskId: string | null;
  setActiveMenuTaskId: (val: string | null) => void;
  batchPasteProject: unknown | null;
  setBatchPasteProject: (val: null) => void;
  batchPasteTarget: unknown | null;
  setBatchPasteTarget: (val: null) => void;
  search: string;
  setSearch: (val: string) => void;
  setMobileSearchOpen: (val: boolean) => void;
  undoState: UndoAction | null;
  setUndoState: (val: null) => void;
  desktopSearchRef: React.RefObject<HTMLInputElement | null>;
  onCycleTheme?: () => void;
}

export function useKeyboardShortcuts({
  isFocusMode,
  setIsFocusMode,
  showMobileAddModal,
  setShowMobileAddModal,
  showGuideModal,
  setShowGuideModal,
  showBackupModal,
  setShowBackupModal,
  showMobileGuideModal,
  setShowMobileGuideModal,
  activeMenuTaskId,
  setActiveMenuTaskId,
  batchPasteProject,
  setBatchPasteProject,
  batchPasteTarget,
  setBatchPasteTarget,
  search,
  setSearch,
  setMobileSearchOpen,
  undoState,
  setUndoState,
  desktopSearchRef,
  onCycleTheme,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        (activeEl as HTMLElement)?.isContentEditable;

      // Esc: Close dialogs, exit focus, clear search
      if (e.key === 'Escape') {
        if (isFocusMode) {
          setIsFocusMode(false);
          return;
        }
        if (showMobileAddModal) {
          setShowMobileAddModal(false);
          return;
        }
        if (showGuideModal) {
          setShowGuideModal(false);
          return;
        }
        if (showBackupModal) {
          setShowBackupModal(false);
          return;
        }
        if (showMobileGuideModal) {
          setShowMobileGuideModal(false);
          return;
        }
        if (activeMenuTaskId) {
          setActiveMenuTaskId(null);
          return;
        }
        if (batchPasteProject || batchPasteTarget) {
          setBatchPasteProject(null);
          setBatchPasteTarget(null);
          return;
        }
        if (search) {
          setSearch('');
          setMobileSearchOpen(false);
          (activeEl as HTMLElement)?.blur?.();
          return;
        }
        if (isInput) {
          (activeEl as HTMLElement)?.blur?.();
        }
        if (undoState) {
          setUndoState(null);
        }
      }

      // Ctrl+Z or Cmd+Z: Undo
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        if (undoState) {
          e.preventDefault();
          undoState.undo();
        }
      }

      // '/' to focus search (when not in input)
      if (e.key === '/' && !isInput && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setMobileSearchOpen(true);
        setTimeout(() => {
          desktopSearchRef.current?.focus();
        }, 60);
      }

      // 'f' or 'F' to toggle Focus Mode
      if ((e.key === 'f' || e.key === 'F') && !isInput && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsFocusMode((prev) => !prev);
      }

      // 'd' or 'D' to cycle Dark / Light / System theme
      if ((e.key === 'd' || e.key === 'D') && !isInput && !e.ctrlKey && !e.metaKey) {
        if (onCycleTheme) {
          e.preventDefault();
          onCycleTheme();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isFocusMode,
    setIsFocusMode,
    showMobileAddModal,
    setShowMobileAddModal,
    showGuideModal,
    setShowGuideModal,
    showBackupModal,
    setShowBackupModal,
    showMobileGuideModal,
    setShowMobileGuideModal,
    activeMenuTaskId,
    setActiveMenuTaskId,
    batchPasteProject,
    setBatchPasteProject,
    batchPasteTarget,
    setBatchPasteTarget,
    search,
    setSearch,
    setMobileSearchOpen,
    undoState,
    setUndoState,
    desktopSearchRef,
    onCycleTheme,
  ]);
}
