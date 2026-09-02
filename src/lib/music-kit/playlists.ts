import { getMusicKit } from "@/lib/music-kit/instance";
import { hasNextPage, readArtwork, readItems, type Artwork } from "@/lib/music-kit/resource";

const PATH = "/v1/me/library/playlists";
const PAGE_SIZE = 100;

export interface LibraryPlaylist {
  id: string;
  name: string;
  description?: string;
  artwork?: Artwork;
  canEdit: boolean;
  hasCatalog: boolean;
  isPublic: boolean;
  dateAdded?: string;
}

export async function fetchLibraryPlaylists(): Promise<LibraryPlaylist[]> {
  const music = await getMusicKit();
  const playlists: LibraryPlaylist[] = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    // oxlint-disable-next-line no-await-in-loop
    const { data } = await music.api.music(PATH, { limit: PAGE_SIZE, offset });
    const items = readItems(data);

    for (const item of items) {
      const playlist = readPlaylist(item);

      if (playlist) {
        playlists.push(playlist);
      }
    }

    if (!hasNextPage(data) || items.length < PAGE_SIZE) {
      return playlists;
    }
  }
}

function readPlaylist(value: unknown): LibraryPlaylist | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const candidate = value as { id?: unknown; attributes?: Record<string, unknown> };
  const attributes = candidate.attributes;

  if (typeof candidate.id !== "string" || typeof attributes?.name !== "string") {
    return undefined;
  }

  return {
    id: candidate.id,
    name: attributes.name,
    description: readDescription(attributes.description),
    artwork: readArtwork(attributes.artwork),
    canEdit: attributes.canEdit === true,
    hasCatalog: attributes.hasCatalog === true,
    isPublic: attributes.isPublic === true,
    dateAdded: typeof attributes.dateAdded === "string" ? attributes.dateAdded : undefined,
  };
}

function readDescription(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const { standard } = value as { standard?: unknown };

  return typeof standard === "string" ? standard : undefined;
}
