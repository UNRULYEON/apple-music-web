import { queryOptions } from "@tanstack/react-query";
import { isRecord } from "@/lib/is-record";
import { catalogPath } from "@/lib/music-kit/api";
import { getMusicKit } from "@/lib/music-kit/instance";
import type { QueueSource } from "@/lib/music-kit/playback";
import { readItems, readRelated, readRelationships } from "@/lib/music-kit/resource";

const INCLUDE = "albums";
const STALE = 24 * 60 * 60 * 1000;

export async function fetchSongSource(id: string): Promise<QueueSource | null> {
  const path = await catalogPath("songs", id);
  const music = await getMusicKit();
  const { data } = await music.api.music(path, { include: INCLUDE });
  const [song] = readItems(data);
  const [albumId] = readRelated(readRelationships(song), INCLUDE, readId);

  return albumId ? { type: "albums", id: albumId } : null;
}

function readId(value: unknown): string | undefined {
  return isRecord(value) && typeof value.id === "string" ? value.id : undefined;
}

export function songSourceQuery(id?: string) {
  return queryOptions({
    queryKey: ["music-kit", "song-source", id],
    queryFn: () => fetchSongSource(id ?? ""),
    enabled: id !== undefined,
    staleTime: STALE,
  });
}
