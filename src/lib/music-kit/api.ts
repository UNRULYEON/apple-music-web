import { getMusicKit } from "@/lib/music-kit/instance";
import { hasNextPage, readItems } from "@/lib/music-kit/resource";
import { fetchStorefront } from "@/lib/music-kit/storefront";

export async function catalogPath(...segments: string[]): Promise<string> {
  const storefront = await fetchStorefront();

  return ["/v1/catalog", storefront.id, ...segments.map(encodeURIComponent)].join("/");
}

export async function fetchEveryPage(
  path: string,
  params: Record<string, unknown>,
  pageSize: number,
  { from = 0, until = Number.POSITIVE_INFINITY }: { from?: number; until?: number } = {},
): Promise<unknown[]> {
  const music = await getMusicKit();
  const items: unknown[] = [];

  for (let offset = from; offset < until; offset += pageSize) {
    // oxlint-disable-next-line no-await-in-loop
    const { data } = await music.api.music(path, { ...params, limit: pageSize, offset });
    const page = readItems(data);
    items.push(...page);

    if (!hasNextPage(data) || page.length < pageSize) {
      break;
    }
  }

  return items;
}
