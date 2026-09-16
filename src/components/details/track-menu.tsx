import { DiscAlbumIcon, Mic01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuSub,
  ContextMenuSubPopup,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu";
import { useSignedInQuery, useView } from "@/hooks";
import { isAlbumType } from "@/lib/music-kit/album";
import { songArtistsQuery } from "@/lib/music-kit/artists";
import type { QueueSource } from "@/lib/music-kit/playback";
import type { Artist } from "@/lib/music-kit/resource";
import { songSourceQuery } from "@/lib/music-kit/song-source";
import type { Song } from "@/lib/music-kit/track";

export function TrackMenuPopup({ song, source }: { song: Song; source?: QueueSource }) {
  return (
    <ContextMenuPopup align="start">
      <TrackMenuItems song={song} source={source} />
    </ContextMenuPopup>
  );
}

function TrackMenuItems({ song, source }: { song: Song; source?: QueueSource }) {
  const { open } = useView();
  const catalogId = song.playId ?? song.id;
  const showsAlbum = !isAlbumType(source?.type);

  const album = useSignedInQuery(songSourceQuery(showsAlbum ? catalogId : undefined));

  const known = song.artists?.filter((artist) => artist.id !== undefined) ?? [];
  const found = useSignedInQuery(songArtistsQuery(known.length > 0 ? undefined : catalogId));
  const artists = (known.length > 0 ? known : (found.data ?? [])).filter(
    (artist) => !(source?.type === "artists" && artist.id === source.id),
  );
  const [onlyArtist] = artists.length === 1 ? artists : [];

  function openArtist(artist: Artist) {
    open({ name: "detail", type: "artists", id: artist.id ?? "" });
  }

  return (
    <>
      {showsAlbum && (
        <ContextMenuItem
          disabled={!album.data}
          onClick={() => album.data && open({ name: "detail", ...album.data })}
        >
          <HugeiconsIcon icon={DiscAlbumIcon} strokeWidth={2} aria-hidden="true" />
          Go to Album
        </ContextMenuItem>
      )}
      {artists.length === 0 && found.isLoading && (
        <ContextMenuItem disabled>
          <HugeiconsIcon icon={Mic01Icon} strokeWidth={2} aria-hidden="true" />
          Go to Artist
        </ContextMenuItem>
      )}
      {onlyArtist && (
        <ContextMenuItem onClick={() => openArtist(onlyArtist)}>
          <HugeiconsIcon icon={Mic01Icon} strokeWidth={2} aria-hidden="true" />
          Go to Artist
        </ContextMenuItem>
      )}
      {artists.length > 1 && (
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <HugeiconsIcon icon={Mic01Icon} strokeWidth={2} aria-hidden="true" />
            Go to Artist
          </ContextMenuSubTrigger>
          <ContextMenuSubPopup>
            {artists.map((artist) => (
              <ContextMenuItem key={artist.id} onClick={() => openArtist(artist)}>
                {artist.name}
              </ContextMenuItem>
            ))}
          </ContextMenuSubPopup>
        </ContextMenuSub>
      )}
    </>
  );
}
