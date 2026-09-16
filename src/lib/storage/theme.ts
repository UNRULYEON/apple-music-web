import { readStorage, writeStorage } from "@/lib/storage/local";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

const listeners = new Set<() => void>();

export function readStoredTheme(): Theme {
  const stored = readStorage(STORAGE_KEY);

  return stored === "light" || stored === "dark" ? stored : "system";
}

export function writeStoredTheme(theme: Theme): void {
  writeStorage(STORAGE_KEY, theme);

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

export const PRE_HYDRATION_SCRIPT = `try{
var t=localStorage.getItem(${JSON.stringify(STORAGE_KEY)});
var d=t==="dark"||(t!=="light"&&matchMedia(${JSON.stringify(DARK_QUERY)}).matches);
document.documentElement.classList.toggle("dark",d);
document.documentElement.style.colorScheme=d?"dark":"light"
}catch(e){}`;

export { DARK_QUERY };
