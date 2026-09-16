const STORAGE_KEY = "volume";

export function readStoredVolume(): number | undefined {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

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
