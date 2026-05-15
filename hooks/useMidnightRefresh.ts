import { useEffect, useRef } from 'react';

function msUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

export function useMidnightRefresh(onRefresh: () => void): void {
  const callbackRef = useRef(onRefresh);
  callbackRef.current = onRefresh;

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>;

    function schedule() {
      timerId = setTimeout(() => {
        callbackRef.current();
        schedule();
      }, msUntilMidnight());
    }

    schedule();
    return () => clearTimeout(timerId);
  }, []);
}
