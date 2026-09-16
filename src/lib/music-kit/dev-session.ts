import { isRecord } from "@/lib/is-record";
import { setAuthStatus } from "@/lib/music-kit/auth";
import { getMusicKit } from "@/lib/music-kit/instance";
import { readStorage, removeStorage, writeStorage } from "@/lib/storage/local";

const SAVED_KEY = "music-kit-devtools.saved-token";

interface SavedToken {
  token: string;
  savedAt: string;
}

export function readSavedAt(): string | undefined {
  return readSaved()?.savedAt;
}

export async function keepSession(): Promise<boolean> {
  const token = await fetchLiveToken();

  if (!token || token === readSaved()?.token) {
    return false;
  }

  const saved: SavedToken = { savedAt: new Date().toISOString(), token };
  writeStorage(SAVED_KEY, JSON.stringify(saved));

  return true;
}

export async function dropToken(): Promise<void> {
  await setToken("");
}

export async function restoreToken(): Promise<boolean> {
  const saved = readSaved();

  return saved ? await setToken(saved.token) : false;
}

export function forgetSession(): void {
  removeStorage(SAVED_KEY);
}

async function setToken(token: string): Promise<boolean> {
  const music = await getMusicKit();
  music.musicUserToken = token;

  const isAuthorized = music.isAuthorized;
  setAuthStatus(isAuthorized ? "signed-in" : "signed-out");

  return isAuthorized;
}

async function fetchLiveToken(): Promise<string | undefined> {
  return await getMusicKit()
    .then((music) => music.musicUserToken)
    .catch(() => undefined);
}

function readSaved(): SavedToken | undefined {
  const raw = readStorage(SAVED_KEY);

  if (!raw) {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return isSavedToken(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function isSavedToken(value: unknown): value is SavedToken {
  return isRecord(value) && typeof value.token === "string" && typeof value.savedAt === "string";
}
