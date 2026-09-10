import { DetailsFooter } from "@/components/details/details-footer";
import { DetailsHeader } from "@/components/details/details-header";
import { DetailsShell } from "@/components/details/details-shell";
import { HiddenItems } from "@/components/details/hidden-items";
import { TrackList } from "@/components/details/track-list";
import { EmptyStates } from "@/components/empty-states";
import { relativeDate } from "@/lib/format";
import { useSearch, useSignedInQuery } from "@/hooks";
import { fetchPlaylist, type PlaylistType } from "@/lib/music-kit/playlists";
import { searchSongs } from "@/lib/music-kit/track";
import { useMemo } from "react";

export function PlaylistDetails({ type, id }: { type: PlaylistType; id: string }) {
  const { data: playlist, isPending } = useSignedInQuery({
    queryKey: ["music-kit", "playlist", type, id],
    queryFn: () => fetchPlaylist(type, id),
  });

  const modified = playlist?.lastModifiedDate ?? playlist?.dateAdded;

  // the search narrows the list of songs. The header and the foot go on telling a
  // person about the whole playlist, so Play still plays it whole.
  const { term } = useSearch();
  const songs = playlist?.songs;
  const shown = useMemo(() => searchSongs(songs ?? [], term), [songs, term]);

  return (
    <DetailsShell id={`${type}-${id}`} artwork={playlist?.artwork} isPending={isPending}>
      {playlist && (
        <>
          <DetailsHeader
            artwork={playlist.artwork}
            name={playlist.name}
            subtitle={playlist.curator?.name}
            meta={
              playlist.description && (
                <span className="max-w-prose text-pretty">{playlist.description}</span>
              )
            }
            songs={playlist.songs}
            source={{ type, id }}
          />
          {shown.length === 0 && playlist.songs.length > 0 ? (
            <EmptyStates.NoMatches />
          ) : (
            <div className="flex flex-col gap-4">
              <TrackList songs={shown} showTrackNumber={false} showArtwork source={{ type, id }} />
              <HiddenItems noun="songs" shown={shown.length} total={playlist.songs.length} />
            </div>
          )}
          <DetailsFooter songs={playlist.songs}>
            {modified && <span>Updated {relativeDate(modified)}</span>}
          </DetailsFooter>
        </>
      )}
    </DetailsShell>
  );
}
