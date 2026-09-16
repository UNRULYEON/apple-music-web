import {
  createContext,
  type ReactNode,
  useCallback,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import { useIsomorphicLayoutEffect, useMediaQuery } from "@/hooks";
import {
  applyTheme,
  DARK_QUERY,
  readInitialTheme,
  readStoredTheme,
  subscribeToTheme,
  type Theme,
  writeStoredTheme,
} from "@/lib/storage/theme";

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribeToTheme, readStoredTheme, readInitialTheme);
  const prefersDark = useMediaQuery(DARK_QUERY);
  const isApplied = useRef(false);

  useIsomorphicLayoutEffect(() => {
    if (!isApplied.current) {
      isApplied.current = true;
      return;
    }

    applyTheme(theme, prefersDark);
  }, [theme, prefersDark]);

  const setTheme: ThemeContextType["setTheme"] = useCallback((next) => {
    writeStoredTheme(next);
  }, []);

  const value = useMemo<ThemeContextType>(() => ({ theme, setTheme }), [setTheme, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
