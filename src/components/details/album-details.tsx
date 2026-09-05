import { DetailsFooter } from "@/components/details/details-footer";
import { DetailsHeader } from "@/components/details/details-header";
import { DetailsShell } from "@/components/details/details-shell";
import { TrackList } from "@/components/details/track-list";
import { releaseYear } from "@/lib/format";
import { fetchAlbum, type AlbumType } from "@/lib/music-kit/album";
import { useAuthStatus } from "@/lib/music-kit/auth";
import { useQuery } from "@tanstack/react-query";
import { intlFormat } from "date-fns";

export function AlbumDetails({ type, id }: { type: AlbumType; id: string }) {
  const status = useAuthStatus();
  const { data: album, isPending } = useQuery({
    queryKey: ["music-kit", "album", type, id],
    queryFn: () => fetchAlbum(type, id),
    enabled: status === "signed-in",
  });

  return (
    <DetailsShell id={`${type}-${id}`} artwork={album?.artwork} isPending={isPending}>
      {album && (
        <>
          <DetailsHeader
            artwork={album.artwork}
            name={album.name}
            subtitle={album.artist?.name}
            meta={album.releaseDate && <span>{releaseYear(album.releaseDate)}</span>}
          />
          <TrackList songs={album.songs} primaryArtist={album.artist?.name} />
          <DetailsFooter songs={album.songs} trackCount={album.trackCount}>
            {album.releaseDate && <span>{intlFormat(album.releaseDate)}</span>}
            {album.copyright && <span className="text-center">{album.copyright}</span>}
          </DetailsFooter>
        </>
      )}
    </DetailsShell>
  );
}
