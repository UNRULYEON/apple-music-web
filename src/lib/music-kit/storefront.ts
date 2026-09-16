import { getMusicKit } from "@/lib/music-kit/instance";
import { readItems, readResource } from "@/lib/music-kit/resource";

export interface Storefront {
  id: string;
  name: string;
}

interface CachedStorefront {
  token: string;
  storefront: Promise<Storefront>;
}

const CACHE = new WeakMap<MusicKit.MusicKitInstance, CachedStorefront>();

export async function fetchStorefront(): Promise<Storefront> {
  const music = await getMusicKit();
  const token = music.musicUserToken ?? "";
  const cached = CACHE.get(music);

  if (cached?.token === token) {
    return cached.storefront;
  }

  const storefront = requestStorefront(music);
  CACHE.set(music, { token, storefront });
  storefront.catch(() => CACHE.delete(music));

  return storefront;
}

async function requestStorefront(music: MusicKit.MusicKitInstance): Promise<Storefront> {
  const { data } = await music.api.music("/v1/me/storefront");
  const [first] = readItems(data);
  const storefront = readResource(first);

  if (!storefront) {
    throw new Error("Apple Music returned no storefront.");
  }

  return { id: storefront.id, name: storefront.name };
}
