import { isRecord } from "@/lib/is-record";
const DETAIL_TYPES = [
  "albums",
  "library-albums",
  "playlists",
  "library-playlists",
  "artists",
  "library-artists",
] as const;

const LIST_NAMES = ["recently-played", "albums", "artists", "playlists", "songs"] as const;

export type DetailType = (typeof DETAIL_TYPES)[number];
export type ListName = (typeof LIST_NAMES)[number];

export type View =
  | { name: "home" }
  | { name: "settings" }
  | { name: "list"; list: ListName }
  | { name: "detail"; type: DetailType; id: string };

export const HOME: View = { name: "home" };

export function viewKey(view: View): string {
  switch (view.name) {
    case "home":
      return "list:recently-played";
    case "list":
      return `list:${view.list}`;
    case "detail":
      return `detail:${view.type}:${view.id}`;
    default:
      return view.name;
  }
}

export function canSearch(view: View): boolean {
  return (
    view.name === "home" ||
    view.name === "detail" ||
    (view.name === "list" && view.list !== "songs")
  );
}

const LIST_SEARCH_LABELS: Record<ListName, string> = {
  "recently-played": "Search recently played",
  albums: "Search albums",
  artists: "Search artists",
  playlists: "Search playlists",
  songs: "Search songs",
};

const DETAIL_SEARCH_LABELS: Record<DetailType, string> = {
  albums: "Search this album",
  "library-albums": "Search this album",
  playlists: "Search this playlist",
  "library-playlists": "Search this playlist",
  artists: "Search this artist",
  "library-artists": "Search this artist",
};

export function searchLabel(view: View): string {
  switch (view.name) {
    case "home":
      return LIST_SEARCH_LABELS["recently-played"];
    case "list":
      return LIST_SEARCH_LABELS[view.list];
    case "detail":
      return DETAIL_SEARCH_LABELS[view.type];
    default:
      return "Search";
  }
}

export function isTopLevel(view: View): boolean {
  return view.name === "home" || view.name === "list";
}

export function readView(value: unknown): View | undefined {
  if (!isRecord(value) || !("name" in value)) {
    return undefined;
  }

  const candidate = value as { name: unknown; list?: unknown; type?: unknown; id?: unknown };

  switch (candidate.name) {
    case "home":
      return { name: "home" };
    case "settings":
      return { name: "settings" };
    case "list":
      return isListName(candidate.list) ? { name: "list", list: candidate.list } : undefined;
    case "detail":
      return isDetailType(candidate.type) && typeof candidate.id === "string"
        ? { name: "detail", type: candidate.type, id: candidate.id }
        : undefined;
    default:
      return undefined;
  }
}

function isListName(value: unknown): value is ListName {
  return LIST_NAMES.includes(value as ListName);
}

function isDetailType(value: unknown): value is DetailType {
  return DETAIL_TYPES.includes(value as DetailType);
}
