import { useMemo } from "react";
import { EmptyStates } from "@/components/empty-states";
import { useSearch, useSignedInQuery } from "@/hooks";
import { relativeDate } from "@/lib/format";
import { playlistQuery, type PlaylistType } from "@/lib/music-kit/playlists";
import { searchSongs } from "@/lib/music-kit/track";
import { DetailsFooter } from "./details-footer";
import { DetailsHeader } from "./details-header";
import { DetailsShell } from "./details-shell";
import { HiddenItems } from "./hidden-items";
import { TrackList } from "./track-list";

export function PlaylistDetails({ type, id }: { type: PlaylistType; id: string }) {
  const { data: playlist, isPending } = useSignedInQuery(playlistQuery(type, id));

  const modified = playlist?.lastModifiedDate ?? playlist?.dateAdded;

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
