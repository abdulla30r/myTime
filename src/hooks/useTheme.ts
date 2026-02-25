import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';

const LS_THEME = 'myTime_theme';

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function useTheme() {
  const [theme, setThemeRaw] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(LS_THEME);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch { /* ignore */ }
    return getSystemTheme();
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(LS_THEME, theme); } catch { /* ignore */ }
  }, [theme]);

  const toggleTheme = () => setThemeRaw((t) => (t === 'dark' ? 'light' : 'dark'));

  return { theme, setTheme: setThemeRaw, toggleTheme };
}
