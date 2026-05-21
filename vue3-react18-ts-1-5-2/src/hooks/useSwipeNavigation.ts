import { RefObject, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { PageKey } from '../types';
import { useUnsavedGuard } from './useUnsavedGuard';

const pages: Array<{ key: PageKey; path: string }> = [
  { key: 'dashboard', path: '/dashboard' },
  { key: 'projects', path: '/projects' },
  { key: 'entry', path: '/entry' },
  { key: 'data', path: '/data' }
];

export const useSwipeNavigation = (ref: RefObject<HTMLElement>) => {
  const location = useLocation();
  const { guardedNavigate } = useUnsavedGuard();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let startX = 0;
    let startY = 0;

    const onStart = (event: TouchEvent) => {
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
    };

    const onEnd = (event: TouchEvent) => {
      const dx = event.changedTouches[0].clientX - startX;
      const dy = event.changedTouches[0].clientY - startY;
      if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy)) return;

      const current = pages.findIndex((page) => location.pathname.startsWith(page.path));
      const next = dx < 0 ? current + 1 : current - 1;
      if (next >= 0 && next < pages.length) {
        guardedNavigate(pages[next].path);
      }
    };

    element.addEventListener('touchstart', onStart, { passive: true });
    element.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      element.removeEventListener('touchstart', onStart);
      element.removeEventListener('touchend', onEnd);
    };
  }, [guardedNavigate, location.pathname, ref]);
};
