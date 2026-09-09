import { DetailsFooter } from "@/components/details/details-footer";
import { DetailsHeader } from "@/components/details/details-header";
import { DetailsShell } from "@/components/details/details-shell";
import { TrackList } from "@/components/details/track-list";
import { releaseYear } from "@/lib/format";
import { useSignedInQuery } from "@/hooks";
import { fetchAlbum, type AlbumType } from "@/lib/music-kit/album";
import { intlFormat } from "date-fns";

export function AlbumDetails({ type, id }: { type: AlbumType; id: string }) {
  const { data: album, isPending } = useSignedInQuery({
    queryKey: ["music-kit", "album", type, id],
    queryFn: () => fetchAlbum(type, id),
  });

  return (
    <DetailsShell id={`${type}-${id}`} artwork={album?.artwork} isPending={isPending}>
      {album && (
        <>
          <DetailsHeader
            artwork={album.artwork}
            name={album.name}
            subtitle={album.artist?.name}
            meta={
              <div className="inline-flex">
                {album.genres.length > 0 && album.genres.join(", ")}
                {album.genres.length > 0 && album.releaseDate && " • "}
                {album.releaseDate && releaseYear(album.releaseDate)}
              </div>
            }
            songs={album.songs}
            source={{ type, id }}
          />
          <TrackList songs={album.songs} primaryArtist={album.artist?.name} source={{ type, id }} />
          <DetailsFooter songs={album.songs} trackCount={album.trackCount}>
            {album.releaseDate && <span>{intlFormat(album.releaseDate)}</span>}
            {album.copyright && <span className="text-center">{album.copyright}</span>}
          </DetailsFooter>
        </>
      )}
    </DetailsShell>
  );
}
