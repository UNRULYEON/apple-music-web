import { useMediaQuery } from "@/hooks";
import {
  applyTheme,
  DARK_QUERY,
  readInitialTheme,
  readStoredTheme,
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
