import { getMusicKit } from "@/lib/music-kit/instance";

export const FULL_VOLUME = 1;

export async function readVolume(): Promise<number> {
  return await getMusicKit()
    .then((music) => music.volume ?? FULL_VOLUME)
    .catch(() => FULL_VOLUME);
}

export async function setVolume(volume: number): Promise<void> {
  const music = await getMusicKit();

  music.volume = volume;
}
