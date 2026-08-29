import { getMusicKit } from "@/lib/music-kit/instance";

// A broken token must show the sign in dialog, not take the whole app down.
export async function loadAuthorization(): Promise<boolean> {
  return await getMusicKit()
    .then((music) => music.isAuthorized)
    .catch(() => false);
}

export async function signIn(): Promise<boolean> {
  const music = await getMusicKit();
  await music.authorize();

  return music.isAuthorized;
}
