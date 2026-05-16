import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function getTodayKST(): string {
  return new Date(Date.now() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

function msUntilMidnightKST(): number {
  return DAY_MS - ((Date.now() + KST_OFFSET_MS) % DAY_MS);
}

const DateContext = createContext<string>(getTodayKST());

export function DateProvider({ children }: { children: React.ReactNode }) {
  const [today, setToday] = useState(getTodayKST);

  const refresh = useCallback(() => {
    setToday(getTodayKST());
  }, []);

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>;

    function schedule() {
      clearTimeout(timerId);
      timerId = setTimeout(() => {
        refresh();
        schedule();
      }, msUntilMidnightKST());
    }

    schedule();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refresh();
        schedule();
      }
    });

    return () => {
      clearTimeout(timerId);
      sub.remove();
    };
  }, [refresh]);

  return <DateContext.Provider value={today}>{children}</DateContext.Provider>;
}

export function useDate(): string {
  return useContext(DateContext);
}
