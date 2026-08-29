import { getMusicKit } from "@/lib/music-kit/instance";

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
