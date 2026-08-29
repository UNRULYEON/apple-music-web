import { vi } from "vitest";
import type { MusicKitAuth } from "@/lib/music-kit/auth";

export function mockAuth({ authorizedAfterLoad }: { authorizedAfterLoad: boolean }): MusicKitAuth {
  const auth: MusicKitAuth = {
    isAuthorized: false,
    ensureLoaded: vi.fn(async () => {
      // Settles on a later tick, so a guard that skips the await reads a stale false.
      await Promise.resolve();
      auth.isAuthorized = authorizedAfterLoad;
    }),
    signIn: vi.fn(),
    signOut: vi.fn(),
  };

  return auth;
}
