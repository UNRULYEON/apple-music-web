import { getMusicKit } from "@/lib/music-kit/instance";

export interface Storefront {
  id: string;
  name: string;
}

export async function fetchStorefront(): Promise<Storefront> {
  const music = await getMusicKit();
  const { data } = await music.api.music("/v1/me/storefront");
  const storefront = readFirst(data);

  if (!storefront) {
    throw new Error("Apple Music returned no storefront.");
  }

  return storefront;
}

function readFirst(data: unknown): Storefront | undefined {
  if (typeof data !== "object" || data === null || !("data" in data)) {
    return undefined;
  }

  const [first] = (data as { data: unknown[] }).data;

  if (typeof first !== "object" || first === null) {
    return undefined;
  }

  const candidate = first as { id?: unknown; attributes?: { name?: unknown } };

  if (typeof candidate.id !== "string" || typeof candidate.attributes?.name !== "string") {
    return undefined;
  }

  return { id: candidate.id, name: candidate.attributes.name };
}
