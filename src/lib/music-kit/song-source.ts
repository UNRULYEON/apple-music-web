import { getMusicKit } from "@/lib/music-kit/instance";
import type { QueueSource } from "@/lib/music-kit/playback";
import { readItems, readRelated } from "@/lib/music-kit/resource";
import { fetchStorefront } from "@/lib/music-kit/storefront";

const INCLUDE = "albums";
const SOURCE_STALE = 24 * 60 * 60 * 1000;

// the album a song sits on. A queue that came back without the album or the playlist it
// was built from still leads somewhere with this.
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

// asked for only when the queue holds no album or playlist of its own
export function songSourceQuery(id?: string) {
  return {
    queryKey: ["music-kit", "song-source", id],
    queryFn: () => (id ? fetchSongSource(id) : null),
    enabled: id !== undefined,
    staleTime: SOURCE_STALE,
  };
}
