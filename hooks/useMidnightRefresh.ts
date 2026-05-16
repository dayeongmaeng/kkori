import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function msUntilMidnightKST(): number {
  const nowKstMs = Date.now() + KST_OFFSET_MS;
  const msIntoDayKST = nowKstMs % DAY_MS;
  return DAY_MS - msIntoDayKST;
}

export function useMidnightRefresh(onRefresh: () => void): void {
  const callbackRef = useRef(onRefresh);
  callbackRef.current = onRefresh;

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>;

    function schedule() {
      clearTimeout(timerId);
      timerId = setTimeout(() => {
        callbackRef.current();
        schedule();
      }, msUntilMidnightKST());
    }

    schedule();

    // 백그라운드 복귀 시 타이머가 정지돼 있을 수 있으므로 재예약
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') schedule();
    });

    return () => {
      clearTimeout(timerId);
      sub.remove();
    };
  }, []);
}
