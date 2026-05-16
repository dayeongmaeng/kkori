import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useAutoSave<T>(
  data: T,
  saveFn: (data: T) => Promise<void>,
  options?: { delay?: number; enabled?: boolean }
): { status: SaveStatus; saveNow: () => Promise<void> } {
  const { delay = 800, enabled = true } = options ?? {};
  const [status, setStatus] = useState<SaveStatus>('idle');

  const dataRef = useRef(data);
  dataRef.current = data;
  const saveFnRef = useRef(saveFn);
  saveFnRef.current = saveFn;

  // null = baseline not yet established (loading phase)
  const baselineRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dataStr = JSON.stringify(data);

  const runSave = useCallback(async () => {
    setStatus('saving');
    try {
      await saveFnRef.current(dataRef.current);
      setStatus('saved');
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      baselineRef.current = null;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      return;
    }

    if (baselineRef.current === null) {
      baselineRef.current = dataStr;
      return;
    }

    if (dataStr === baselineRef.current) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      runSave();
    }, delay);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  // dataStr과 enabled만 감지. saveFn/delay는 ref로 최신값 참조.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataStr, enabled, delay]);

  const saveNow = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    await runSave();
  }, [runSave]);

  return { status, saveNow };
}
