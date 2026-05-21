import { useCallback, useRef } from 'react';

export const useThrottle = <Args extends unknown[]>(fn: (...args: Args) => void, wait = 250) => {
  const lastRun = useRef(0);
  const trailing = useRef<number>();

  return useCallback(
    (...args: Args) => {
      const now = Date.now();
      const remaining = wait - (now - lastRun.current);

      if (remaining <= 0) {
        window.clearTimeout(trailing.current);
        lastRun.current = now;
        fn(...args);
        return;
      }

      window.clearTimeout(trailing.current);
      trailing.current = window.setTimeout(() => {
        lastRun.current = Date.now();
        fn(...args);
      }, remaining);
    },
    [fn, wait]
  );
};
