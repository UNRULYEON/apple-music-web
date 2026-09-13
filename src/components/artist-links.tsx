import { useView } from "@/hooks";
import type { Artist } from "@/lib/music-kit/resource";

// the artists of a song, one after another, each leading to its own screen. Apple sends
// them only when it is asked, so a song without them keeps its plain text.
export function ArtistLinks({
  artists,
  fallback,
  onNavigate,
}: {
  artists?: Artist[];
  fallback?: string;
  onNavigate?: () => void;
}) {
  const { open } = useView();
  const named = artists?.filter((artist) => artist.id !== undefined) ?? [];

  if (named.length === 0) {
    return fallback ?? null;
  }

  return named.map((artist, i) => (
    <span key={artist.id}>
      {i > 0 && ", "}
      <ArtistLink artist={artist} onOpen={open} onNavigate={onNavigate} />
    </span>
  ));
}

function ArtistLink({
  artist,
  onOpen,
  onNavigate,
}: {
  artist: Artist;
  onOpen: ReturnType<typeof useView>["open"];
  onNavigate?: () => void;
}) {
  // a track row is itself a button, so this is a span. The tap must not reach the row
  // behind it, or a person who asks for an artist would start the song instead.
  function go(event: { stopPropagation: () => void }) {
    event.stopPropagation();
    onOpen({ name: "detail", type: "artists", id: artist.id ?? "" });
    onNavigate?.();
  }

  return (
    <span
      role="link"
      tabIndex={0}
      onClick={go}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          go(event);
        }
      }}
      className="cursor-pointer rounded-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-neutral-500"
    >
      {artist.name}
    </span>
  );
}
