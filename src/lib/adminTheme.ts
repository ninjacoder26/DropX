import { useEffect, useState } from 'react';
import { safeGet, safeSet } from './storage';

export type AdminTheme = 'light' | 'dark';

const KEY = 'dropx-admin-theme';

/** Admin-only theme (persisted per browser). Defaults to light. */
export function useAdminTheme(): { theme: AdminTheme; toggle: () => void } {
  const [theme, setTheme] = useState<AdminTheme>(() => safeGet<AdminTheme>(KEY, 'light'));

  useEffect(() => {
    safeSet(KEY, theme);
  }, [theme]);

  return {
    theme,
    toggle: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')),
  };
}
