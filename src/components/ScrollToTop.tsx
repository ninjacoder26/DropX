import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Consistent scroll on every navigation:
 * - PUSH (links, tabs, filters): start at the top.
 * - POP (browser back/forward): restore where you were.
 * Positions live in memory per route — a full reload starts at the top,
 * which is the standard everyone expects.
 */
export function ScrollToTop() {
  const { pathname, search } = useLocation();
  const navType = useNavigationType();
  const key = `${pathname}${search}`;
  const saved = useRef(new Map<string, number>());

  useEffect(() => {
    if (navType === 'POP') {
      window.scrollTo(0, saved.current.get(key) ?? 0);
    } else {
      window.scrollTo(0, 0);
    }
    const onScroll = () => {
      saved.current.set(key, window.scrollY);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [key, navType]);
  return null;
}
