import { isRecord } from "@/lib/is-record";

const CROP = "bb";
const FORMAT = "jpg";

export interface Artist {
  id?: string;
  name: string;
}

export interface Curator {
  name: string;
}

export interface Artwork {
  url: string;
  width: number;
  height: number;
  bgColor?: string;
  textColor1?: string;
  textColor2?: string;
  textColor3?: string;
  textColor4?: string;
  mosaic?: Artwork[];
}

export interface Resource {
  id: string;
  name: string;
  attributes: Record<string, unknown>;
  relationships?: unknown;
  views?: unknown;
}

export const MOSAIC_SIZE = 4;

export function mosaicArtwork(artworks: (Artwork | undefined)[]): Artwork | undefined {
  const byUrl = new Map<string, Artwork>();

  for (const artwork of artworks) {
    if (artwork && !byUrl.has(artwork.url)) {
      byUrl.set(artwork.url, artwork);
    }
  }

  const covers = [...byUrl.values()];
  const [first] = covers;

  if (!first || covers.length < MOSAIC_SIZE) {
    return first;
  }

  return { ...first, mosaic: covers.slice(0, MOSAIC_SIZE) };
}

export function artworkColors(artwork?: Artwork): string[] {
  return [
    artwork?.bgColor,
    artwork?.textColor1,
    artwork?.textColor2,
    artwork?.textColor3,
    artwork?.textColor4,
  ].filter((color) => color !== undefined);
}

export function readResource(value: unknown): Resource | undefined {
  if (!isRecord(value) || typeof value.id !== "string" || !isRecord(value.attributes)) {
    return undefined;
  }

  const { name } = value.attributes;

  if (typeof name !== "string") {
    return undefined;
  }

  return {
    id: value.id,
    name,
    attributes: value.attributes,
    relationships: value.relationships,
    views: value.views,
  };
}

export function readRelationships(value: unknown): unknown {
  return isRecord(value) ? value.relationships : undefined;
}

export function readItems(data: unknown): unknown[] {
  return isRecord(data) && Array.isArray(data.data) ? data.data : [];
}

export function hasNextPage(data: unknown): boolean {
  return isRecord(data) && typeof data.next === "string";
}

export function readArtist(value: unknown): Artist | undefined {
  return readName(value);
}

export function readArtistRef(value: unknown): Artist | undefined {
  const resource = readResource(value);

  return resource && { id: resource.id, name: resource.name };
}

export function readCurator(value: unknown): Curator | undefined {
  return readName(value);
}

function readName(value: unknown): { name: string } | undefined {
  return typeof value === "string" ? { name: value } : undefined;
}

export function readArtwork(value: unknown): Artwork | undefined {
  if (
    !isRecord(value) ||
    typeof value.url !== "string" ||
    typeof value.width !== "number" ||
    typeof value.height !== "number"
  ) {
    return undefined;
  }

  return {
    url: value.url,
    width: value.width,
    height: value.height,
    bgColor: readColor(value.bgColor),
    textColor1: readColor(value.textColor1),
    textColor2: readColor(value.textColor2),
    textColor3: readColor(value.textColor3),
    textColor4: readColor(value.textColor4),
  };
}

function readColor(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? `#${value}` : undefined;
}

export function artworkUrl(artwork: Artwork, size: number): string {
  const wanted = Math.round(size * (globalThis.devicePixelRatio ?? 1));

  return artwork.url
    .replace("{w}", String(Math.min(wanted, artwork.width)))
    .replace("{h}", String(Math.min(wanted, artwork.height)))
    .replace("{c}", CROP)
    .replace("{f}", FORMAT);
}

export function readText(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function readNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

export function readStandard(value: unknown): string | undefined {
  return isRecord(value) ? (readText(value.standard) ?? readText(value.short)) : undefined;
}

export function readGenres(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((genre) => typeof genre === "string") : [];
}

export function readRelated<T>(
  relationships: unknown,
  name: string,
  read: (value: unknown) => T | undefined,
): T[] {
  if (!isRecord(relationships)) {
    return [];
  }

  return readItems(relationships[name])
    .map(read)
    .filter((item) => item !== undefined);
}
