import { DetailsArtwork } from "@/components/details/details-artwork";
import { usePlayer } from "@/hooks";
import type { QueueSource } from "@/lib/music-kit/playback";
import type { Artwork } from "@/lib/music-kit/resource";
import type { Song } from "@/lib/music-kit/track";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function DetailsHeader({
  artwork,
  name,
  subtitle,
  meta,
  songs,
  source,
}: {
  artwork?: Artwork;
  name: string;
  subtitle?: ReactNode;
  meta?: ReactNode;
  songs: Song[];
  source?: QueueSource;
}) {
  const { play } = usePlayer();
  const isEmpty = songs.length === 0;

  return (
    <div className="flex flex-col gap-8 sm:gap-8 sm:flex-row items-center">
      <div className="w-full max-w-96 sm:w-64 sm:shrink-0">
        <DetailsArtwork artwork={artwork} name={name} />
      </div>
      <div className="flex flex-col gap-4 items-center sm:items-start">
        <div className="flex flex-col items-center sm:items-start">
          <span className="font-bold text-xl sm:text-2xl">{name}</span>
          {subtitle && <span className="text-base">{subtitle}</span>}
        </div>
        {meta && (
          <div className="flex flex-col gap-1 items-center sm:items-start text-center sm:text-left text-xs text-neutral-500 dark:text-neutral-400 theme-fade-text">
            {meta}
          </div>
        )}
        <div className="flex gap-4">
          <Button disabled={isEmpty} onClick={() => play(songs, { from: source })}>
            Play
          </Button>
          <Button
            variant="secondary"
            disabled={isEmpty}
            onClick={() => play(songs, { shuffle: true, from: source })}
          >
            Shuffle
          </Button>
        </div>
      </div>
    </div>
  );
}
