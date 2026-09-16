import {
  createContext,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import { useMediaQuery } from "@/hooks";
import {
  applyTheme,
  DARK_QUERY,
  readInitialTheme,
  readStoredTheme,
  subscribeToTheme,
  type Theme,
  writeStoredTheme,
} from "@/lib/theme-storage";

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

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
