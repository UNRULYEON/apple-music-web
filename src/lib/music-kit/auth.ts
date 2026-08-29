import { getMusicKit } from "@/lib/music-kit/instance";

export interface MusicKitAuth {
  isAuthorized: boolean;
  ensureLoaded: () => Promise<void>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function createMusicKitAuth(): MusicKitAuth {
  const auth: MusicKitAuth = { isAuthorized: false, ensureLoaded, signIn, signOut };

  async function ensureLoaded(): Promise<void> {
    // The prerendered shell has no browser globals for MusicKit to attach to.
    if (typeof document === "undefined") {
      return;
    }

    // A broken token must land on the login page, not on the router error screen.
    auth.isAuthorized = await getMusicKit()
      .then((music) => music.isAuthorized)
      .catch(() => false);
  }

  async function signIn(): Promise<void> {
    const music = await getMusicKit();
    await music.authorize();
    auth.isAuthorized = music.isAuthorized;
  }

  async function signOut(): Promise<void> {
    const music = await getMusicKit();
    await music.unauthorize();
    auth.isAuthorized = music.isAuthorized;
  }

  return auth;
}
