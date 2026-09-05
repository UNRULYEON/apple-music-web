const CROP = "bb";
const FORMAT = "jpg";

export interface Artist {
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
}

export function readItems(data: unknown): unknown[] {
  if (typeof data !== "object" || data === null || !("data" in data)) {
    return [];
  }

  const items = (data as { data: unknown }).data;

  return Array.isArray(items) ? items : [];
}

export function hasNextPage(data: unknown): boolean {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  return typeof (data as { next?: unknown }).next === "string";
}

export function readArtist(value: unknown): Artist | undefined {
  return readName(value);
}

export function readCurator(value: unknown): Curator | undefined {
  return readName(value);
}

function readName(value: unknown): { name: string } | undefined {
  return typeof value === "string" ? { name: value } : undefined;
}

export function readArtwork(value: unknown): Artwork | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const candidate = value as {
    url?: unknown;
    width?: unknown;
    height?: unknown;
    bgColor?: unknown;
    textColor1?: unknown;
    textColor2?: unknown;
    textColor3?: unknown;
    textColor4?: unknown;
  };

  if (
    typeof candidate.url !== "string" ||
    typeof candidate.width !== "number" ||
    typeof candidate.height !== "number"
  ) {
    return undefined;
  }

  return {
    url: candidate.url,
    width: candidate.width,
    height: candidate.height,
    bgColor: readColor(candidate.bgColor),
    textColor1: readColor(candidate.textColor1),
    textColor2: readColor(candidate.textColor2),
    textColor3: readColor(candidate.textColor3),
    textColor4: readColor(candidate.textColor4),
  };
}

// the api gives a hex color without the leading hash
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
