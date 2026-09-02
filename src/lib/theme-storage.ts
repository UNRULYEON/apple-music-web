export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const listeners = new Set<() => void>();

export function readStoredTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

export function writeStoredTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {}

  for (const listener of listeners) {
    listener();
  }
}

export function subscribeToTheme(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function readInitialTheme(): Theme {
  return "system";
}

export function applyTheme(theme: Theme, prefersDark: boolean): void {
  const dark = theme === "dark" || (theme === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

export function startThemeTransition(update: () => void): void {
  if (!document.startViewTransition || window.matchMedia(REDUCED_MOTION_QUERY).matches) {
    update();
    return;
  }

  document.startViewTransition(update);
}

export const preHydrationScript = `try{
var t=localStorage.getItem(${JSON.stringify(STORAGE_KEY)});
var d=t==="dark"||(t!=="light"&&matchMedia(${JSON.stringify(DARK_QUERY)}).matches);
document.documentElement.classList.toggle("dark",d);
document.documentElement.style.colorScheme=d?"dark":"light"
}catch(e){}`;

export { DARK_QUERY };
