import { useEffect } from 'react';

/** Sets `document.title` while mounted, restores the default afterwards. */
export function usePageTitle(title: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = `${title} | DropX`;
    return () => {
      document.title = prev;
    };
  }, [title]);
}
