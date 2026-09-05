import { DetailsFooter } from "@/components/details/details-footer";
import { DetailsHeader } from "@/components/details/details-header";
import { DetailsShell } from "@/components/details/details-shell";
import { TrackList } from "@/components/details/track-list";
import { useAuthStatus } from "@/lib/music-kit/auth";
import { fetchPlaylist, type PlaylistType } from "@/lib/music-kit/playlists";
import { useQuery } from "@tanstack/react-query";
import { intlFormat } from "date-fns";

export function PlaylistDetails({ type, id }: { type: PlaylistType; id: string }) {
  const status = useAuthStatus();
  const { data: playlist, isPending } = useQuery({
    queryKey: ["music-kit", "playlist", type, id],
    queryFn: () => fetchPlaylist(type, id),
    enabled: status === "signed-in",
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
          <TrackList songs={playlist.songs} showArtwork />
          <DetailsFooter songs={playlist.songs}>
            {modified && <span>Updated {intlFormat(modified)}</span>}
          </DetailsFooter>
        </>
      )}
    </DetailsShell>
  );
}
