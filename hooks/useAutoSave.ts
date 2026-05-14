import { useEffect, useRef, useState } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useAutoSave<T>(
  data: T,
  saveFn: (data: T) => Promise<void>,
  options?: { delay?: number; enabled?: boolean }
): { status: SaveStatus } {
  const { delay = 800, enabled = true } = options ?? {};
  const [status, setStatus] = useState<SaveStatus>('idle');

  // Always use latest data and saveFn without re-triggering the effect
  const dataRef = useRef(data);
  dataRef.current = data;
  const saveFnRef = useRef(saveFn);
  saveFnRef.current = saveFn;

  // null = baseline not yet established (loading phase)
  const baselineRef = useRef<string | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dataStr = JSON.stringify(data);

  useEffect(() => {
    if (!enabled) {
      // Reset baseline so next enable re-establishes it without saving
      baselineRef.current = null;
      return;
    }

    if (baselineRef.current === null) {
      // First run after enable: record baseline, don't save
      baselineRef.current = dataStr;
      return;
    }

    if (dataStr === baselineRef.current) return;

    const timer = setTimeout(async () => {
      setStatus('saving');
      try {
        await saveFnRef.current(dataRef.current);
        setStatus('saved');
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => setStatus('idle'), 2000);
      } catch {
        setStatus('error');
      }
    }, delay);

    return () => clearTimeout(timer);
  // dataStr과 enabled만 감지. saveFn/delay는 ref로 최신값 참조.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataStr, enabled, delay]);

  return { status };
}
