import { setAuthStatus } from "@/lib/music-kit/auth";
import { getMusicKit } from "@/lib/music-kit/instance";

const SAVED_KEY = "music-kit-devtools.saved-token";

interface SavedToken {
  token: string;
  savedAt: string;
}

export function readSavedAt(): string | undefined {
  return readSaved()?.savedAt;
}

export async function keepSession(): Promise<boolean> {
  const token = await liveToken();

  if (!token || token === readSaved()?.token) {
    return false;
  }

  const saved: SavedToken = { savedAt: new Date().toISOString(), token };
  localStorage.setItem(SAVED_KEY, JSON.stringify(saved));

  return true;
}

// The setter reaches StoreKit, which holds the token in memory, in storage, and in
// the authorization status. unauthorize() is no use here: it also ends the session
// at Apple. An empty token therefore signs the user out of this browser only.
export async function dropToken(): Promise<void> {
  await setToken("");
}

export async function restoreToken(): Promise<boolean> {
  const saved = readSaved();

  return saved ? await setToken(saved.token) : false;
}

export function forgetSession(): void {
  localStorage.removeItem(SAVED_KEY);
}

async function setToken(token: string): Promise<boolean> {
  const music = await getMusicKit();
  music.musicUserToken = token;

  const isAuthorized = music.isAuthorized;
  setAuthStatus(isAuthorized ? "signed-in" : "signed-out");

  return isAuthorized;
}

async function liveToken(): Promise<string | undefined> {
  return await getMusicKit()
    .then((music) => music.musicUserToken)
    .catch(() => undefined);
}

function readSaved(): SavedToken | undefined {
  const raw = localStorage.getItem(SAVED_KEY);

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
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<SavedToken>;

  return typeof candidate.token === "string" && typeof candidate.savedAt === "string";
}
