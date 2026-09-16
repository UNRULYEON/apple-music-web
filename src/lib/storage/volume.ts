import { readStorage, removeStorage, writeStorage } from "@/lib/storage/local";

const STORAGE_KEY = "volume";

export function readStoredVolume(): number | undefined {
  const stored = readStorage(STORAGE_KEY);

  if (stored === undefined || stored.trim() === "") {
    return undefined;
  }

  const level = Number(stored);

  return Number.isFinite(level) && level >= 0 && level <= 1 ? level : undefined;
}

export function writeStoredVolume(volume: number): void {
  writeStorage(STORAGE_KEY, String(volume));
}

export function forgetStoredVolume(): void {
  removeStorage(STORAGE_KEY);
}
