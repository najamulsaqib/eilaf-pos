import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

export type TThemeMode = 'light' | 'dark' | 'system';

interface IThemeContextValue {
  theme: TThemeMode;
  setTheme: (theme: TThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<IThemeContextValue>({
  theme: 'system',
  setTheme: () => {},
  isDark: false,
});

function resolveIsDark(mode: TThemeMode): boolean {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<TThemeMode>(
    () => (localStorage.getItem('theme_mode') as TThemeMode) ?? 'system',
  );

  const isDark = resolveIsDark(theme);

  const setTheme = (newTheme: TThemeMode) => {
    localStorage.setItem('theme_mode', newTheme);
    setThemeState(newTheme);
  };

  const value = useMemo(
    () => ({ theme, setTheme, isDark }),
    [theme, isDark],
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolveIsDark(theme));

    if (theme !== 'system') return undefined;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle('dark', e.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
