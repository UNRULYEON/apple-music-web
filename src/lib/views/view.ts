const DETAIL_TYPES = [
  "albums",
  "library-albums",
  "playlists",
  "library-playlists",
  "stations",
] as const;

const LIST_NAMES = ["recently-played", "albums", "playlists", "songs"] as const;

export type DetailType = (typeof DETAIL_TYPES)[number];
export type ListName = (typeof LIST_NAMES)[number];

export type View =
  | { name: "home" }
  | { name: "settings" }
  | { name: "list"; list: ListName }
  | { name: "detail"; type: DetailType; id: string };

export const HOME: View = { name: "home" };

export function isTopLevel(view: View): boolean {
  return view.name === "home" || view.name === "list";
}

export function readView(value: unknown): View | undefined {
  if (typeof value !== "object" || value === null || !("name" in value)) {
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
