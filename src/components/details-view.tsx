import { AlbumDetails, PlaylistDetails } from "@/components/details";
import { usePrefetchRecentlyPlayed } from "@/hooks";
import { isAlbumType } from "@/lib/music-kit/album";
import { isPlaylistType } from "@/lib/music-kit/playlists";
import type { DetailType } from "@/lib/views/view";

export function DetailsView({ type, id }: { type: DetailType; id: string }) {
  usePrefetchRecentlyPlayed();

  if (isAlbumType(type)) {
    return <AlbumDetails type={type} id={id} />;
  }

  if (isPlaylistType(type)) {
    return <PlaylistDetails type={type} id={id} />;
  }

  return <Placeholder type={type} id={id} />;
}

function Placeholder({ type, id }: { type: DetailType; id: string }) {
  return (
    <div className="flex flex-col gap-4 grow px-4 pb-4">
      <div className="text-muted-foreground text-sm">
        {type} · {id}
      </div>
    </div>
  );
}
