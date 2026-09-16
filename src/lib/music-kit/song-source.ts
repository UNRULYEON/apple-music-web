import { queryOptions } from "@tanstack/react-query";
import { getMusicKit } from "@/lib/music-kit/instance";
import type { QueueSource } from "@/lib/music-kit/playback";
import { readItems, readRelated } from "@/lib/music-kit/resource";
import { fetchStorefront } from "@/lib/music-kit/storefront";

const INCLUDE = "albums";
const STALE = 24 * 60 * 60 * 1000;

export async function fetchSongSource(id: string): Promise<QueueSource | null> {
  const storefront = await fetchStorefront();
  const music = await getMusicKit();
  const { data } = await music.api.music(
    `/v1/catalog/${storefront.id}/songs/${encodeURIComponent(id)}`,
    { include: INCLUDE },
  );
  const [song] = readItems(data);
  const [albumId] = readRelated(readRelationships(song), INCLUDE, readId);

  return albumId ? { type: "albums", id: albumId } : null;
}

function readRelationships(value: unknown): unknown {
  return typeof value === "object" && value !== null
    ? (value as { relationships?: unknown }).relationships
    : undefined;
}

function readId(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const { id } = value as { id?: unknown };

  return typeof id === "string" ? id : undefined;
}

export function songSourceQuery(id?: string) {
  return queryOptions({
    queryKey: ["music-kit", "song-source", id],
    queryFn: () => fetchSongSource(id ?? ""),
    enabled: id !== undefined,
    staleTime: STALE,
  });
}
