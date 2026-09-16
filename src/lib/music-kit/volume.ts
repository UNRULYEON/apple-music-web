import { getMusicKit } from "@/lib/music-kit/instance";

export const FULL_VOLUME = 1;

export async function fetchVolume(): Promise<number> {
  return await getMusicKit()
    .then((music) => music.volume ?? FULL_VOLUME)
    .catch(() => FULL_VOLUME);
}

export async function applyVolume(volume: number): Promise<void> {
  const music = await getMusicKit();

  music.volume = volume;
}
