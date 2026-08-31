import { useMediaQuery } from "@/hooks";
import {
  applyTheme,
  DARK_QUERY,
  readInitialTheme,
  readStoredTheme,
  startThemeTransition,
  subscribeToTheme,
  writeStoredTheme,
  type Theme,
} from "@/lib/theme-storage";
import {
  createContext,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";

export type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribeToTheme, readStoredTheme, readInitialTheme);
  const prefersDark = useMediaQuery(DARK_QUERY);
  const isApplied = useRef(false);

  // A layout effect, so flushSync applies the class inside the view transition.
  useIsomorphicLayoutEffect(() => {
    // The pre-hydration script owns the first paint. A second paint here would
    // flash the system theme before the store reports the stored one.
    if (!isApplied.current) {
      isApplied.current = true;
      return;
    }

    applyTheme(theme, prefersDark);
  }, [theme, prefersDark]);

  const setTheme: ThemeContextType["setTheme"] = useCallback((next) => {
    startThemeTransition(() => flushSync(() => writeStoredTheme(next)));
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
