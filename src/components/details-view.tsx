import {
  AlbumDetails,
  ArtistDetails,
  LibraryArtistDetails,
  PlaylistDetails,
} from "@/components/details";
import { isAlbumType } from "@/lib/music-kit/album";
import type { DetailType } from "@/lib/views/view";

export function DetailsView({ type, id }: { type: DetailType; id: string }) {
  if (type === "artists") {
    return <ArtistDetails id={id} />;
  }

  if (type === "library-artists") {
    return <LibraryArtistDetails id={id} />;
  }

  if (isAlbumType(type)) {
    return <AlbumDetails type={type} id={id} />;
  }

  return <PlaylistDetails type={type} id={id} />;
}
