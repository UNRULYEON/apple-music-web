import { ArtworkImage } from "@/components/artwork";
import type { Artwork } from "@/lib/music-kit/resource";

const ARTWORK_SIZE = 512;

export function DetailsArtwork({ artwork, name }: { artwork?: Artwork; name: string }) {
  return (
    <ArtworkImage
      artwork={artwork}
      alt={name}
      size={ARTWORK_SIZE}
      iconSize={96}
      className="rounded-xl outline-artwork-outline outline-2 -outline-offset-2"
    />
  );
}
