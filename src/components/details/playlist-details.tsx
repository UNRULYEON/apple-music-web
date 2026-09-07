import { DetailsFooter } from "@/components/details/details-footer";
import { DetailsHeader } from "@/components/details/details-header";
import { DetailsShell } from "@/components/details/details-shell";
import { TrackList } from "@/components/details/track-list";
import { relativeDate } from "@/lib/format";
import { useSignedInQuery } from "@/hooks";
import { fetchPlaylist, type PlaylistType } from "@/lib/music-kit/playlists";

export function PlaylistDetails({ type, id }: { type: PlaylistType; id: string }) {
  const { data: playlist, isPending } = useSignedInQuery({
    queryKey: ["music-kit", "playlist", type, id],
    queryFn: () => fetchPlaylist(type, id),
  });

  const modified = playlist?.lastModifiedDate ?? playlist?.dateAdded;

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
          />
          <TrackList
            songs={playlist.songs}
            showTrackNumber={false}
            showArtwork
            source={{ type, id }}
          />
          <DetailsFooter songs={playlist.songs}>
            {modified && <span>Updated {relativeDate(modified)}</span>}
          </DetailsFooter>
        </>
      )}
    </DetailsShell>
  );
}
