const STORAGE_KEY = "volume";

// a browser can turn its storage down, and a volume that cannot be kept is no reason
// to stop the app
export function readStoredVolume(): number | undefined {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    // an empty store and a word both turn into a number, and neither is a volume
    if (stored === null || stored.trim() === "") {
      return undefined;
    }

    const level = Number(stored);

    return Number.isFinite(level) && level >= 0 && level <= 1 ? level : undefined;
  } catch {
    return undefined;
  }
}

export function writeStoredVolume(volume: number): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(volume));
  } catch {}
}

export function forgetStoredVolume(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
