import { artworkUrl, type Artwork } from "@/lib/music-kit/resource";
import { MusicNote02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const ARTWORK_SIZE = 512;

const SHAPE =
  "aspect-square w-full object-cover select-none rounded-xl outline-neutral-50/50 dark:outline-neutral-900/50 outline-1 -outline-offset-1";

export function DetailsArtwork({ artwork, name }: { artwork?: Artwork; name: string }) {
  if (!artwork) {
    return (
      <div className={`${SHAPE} flex items-center justify-center bg-muted`}>
        <HugeiconsIcon icon={MusicNote02Icon} size={96} className="text-muted-foreground" />
      </div>
    );
  }

  return (
    <img src={artworkUrl(artwork, ARTWORK_SIZE)} alt={name} draggable={false} className={SHAPE} />
  );
}
