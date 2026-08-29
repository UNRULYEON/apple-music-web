import { useSyncExternalStore } from "react";
import { getMusicKit } from "@/lib/music-kit/instance";

export type AuthStatus = "checking" | "signed-out" | "signed-in";

// MusicKit holds the token in memory, so one store keeps every reader in step.
let status: AuthStatus = "checking";
const listeners = new Set<() => void>();

export function useAuthStatus(): AuthStatus {
  return useSyncExternalStore(subscribeToAuthStatus, readAuthStatus, readInitialStatus);
}

export function setAuthStatus(next: AuthStatus): void {
  if (next === status) {
    return;
  }

  status = next;

  for (const listener of listeners) {
    listener();
  }
}

export async function loadAuthorization(): Promise<void> {
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

export function subscribeToAuthStatus(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function readAuthStatus(): AuthStatus {
  return status;
}

// The server renders no token, so it always renders the loading state.
function readInitialStatus(): AuthStatus {
  return "checking";
}
