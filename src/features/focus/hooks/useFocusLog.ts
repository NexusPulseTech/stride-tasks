import { useState, useCallback, useMemo, useRef } from 'react';
import {
  FOCUS_LOG_KEY,
  FocusLogStore,
  appendFocusLog,
  archiveOldFocusEntries,
  readFocusLog,
  summarizeFocusLog,
} from '../utils/focusLog';
import { safeSetItem } from '../../../utils/persistentStorage';

export function useFocusLog() {
  const [store, setStore] = useState<FocusLogStore>(() => archiveOldFocusEntries(readFocusLog()));
  const storeRef = useRef(store);
  storeRef.current = store;

  const recordFocus = useCallback(
    (entry: { taskId: string; projectId: string; minutes: number; completedSession: boolean }) => {
      const next = appendFocusLog(storeRef.current, entry);
      storeRef.current = next;
      setStore(next);
      safeSetItem(FOCUS_LOG_KEY, JSON.stringify(next));
    },
    []
  );

  const summary = useMemo(() => summarizeFocusLog(store), [store]);

  return { store, summary, recordFocus };
}
