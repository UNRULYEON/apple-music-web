import { isRecord } from "@/lib/is-record";
import { catalogPath } from "@/lib/music-kit/api";
import { getMusicKit } from "@/lib/music-kit/instance";
import { readItems } from "@/lib/music-kit/resource";

export interface CatalogRef {
  type: string;
  id: string;
}

export async function fetchCatalogResources(
  refs: readonly CatalogRef[],
  params: Record<string, string> = {},
): Promise<unknown[]> {
  if (refs.length === 0) {
    return [];
  }

  const music = await getMusicKit();
  const types = [...new Set(refs.map((ref) => ref.type))];

  const responses = await Promise.all(
    types.map(async (type) =>
      music.api.music(await catalogPath(type), {
        ...params,
        ids: refs
          .filter((ref) => ref.type === type)
          .map((ref) => ref.id)
          .join(","),
      }),
    ),
  );

  const byRef = new Map<string, unknown>();

  for (const { data } of responses) {
    for (const item of readItems(data)) {
      if (isRecord(item)) {
        byRef.set(`${String(item.type)}:${String(item.id)}`, item);
      }
    }
  }

  return refs.map((ref) => byRef.get(`${ref.type}:${ref.id}`)).filter((item) => item !== undefined);
}
