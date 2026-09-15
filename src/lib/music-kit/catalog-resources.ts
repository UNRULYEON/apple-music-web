import { getMusicKit } from "@/lib/music-kit/instance";
import { readItems } from "@/lib/music-kit/resource";
import { fetchStorefront } from "@/lib/music-kit/storefront";

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

  const storefront = await fetchStorefront();
  const music = await getMusicKit();
  const types = [...new Set(refs.map((ref) => ref.type))];

  const responses = await Promise.all(
    types.map((type) =>
      music.api.music(`/v1/catalog/${storefront.id}/${type}`, {
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
      const candidate = item as { type?: unknown; id?: unknown } | null;
      byRef.set(`${String(candidate?.type)}:${String(candidate?.id)}`, item);
    }
  }

  return refs.map((ref) => byRef.get(`${ref.type}:${ref.id}`)).filter((item) => item !== undefined);
}
