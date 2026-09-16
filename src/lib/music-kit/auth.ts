import { createListeners } from "@/lib/listeners";
import { getMusicKit } from "@/lib/music-kit/instance";

export type AuthStatus = "checking" | "signed-out" | "signed-in";

let status: AuthStatus = "checking";
const listeners = createListeners();

export function setAuthStatus(next: AuthStatus): void {
  if (next === status) {
    return;
  }

  status = next;

  listeners.notify();
}

export async function checkAuthorization(): Promise<void> {
  const authorized = await getMusicKit()
    .then((music) => music.isAuthorized)
    .catch(() => false);

  setAuthStatus(authorized ? "signed-in" : "signed-out");
}

export async function signIn(): Promise<void> {
  const music = await getMusicKit();
  await music.authorize();

  setAuthStatus(music.isAuthorized ? "signed-in" : "signed-out");
}

export async function signOut(): Promise<void> {
  const music = await getMusicKit();
  await music.unauthorize();

  setAuthStatus(music.isAuthorized ? "signed-in" : "signed-out");
}

export function subscribeToAuthStatus(listener: () => void): () => void {
  return listeners.subscribe(listener);
}

export function readAuthStatus(): AuthStatus {
  return status;
}

export function readInitialAuthStatus(): AuthStatus {
  return "checking";
}
