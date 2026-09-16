import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/hooks";
import type { QueueSource } from "@/lib/music-kit/playback";
import type { Artwork } from "@/lib/music-kit/resource";
import type { Song } from "@/lib/music-kit/track";
import { DetailsArtwork } from "./details-artwork";

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
    <div className="flex flex-col items-center gap-8 sm:flex-row sm:gap-8">
      <div className="w-full max-w-96 sm:w-64 sm:shrink-0">
        <DetailsArtwork artwork={artwork} name={name} />
      </div>
      <div className="flex flex-col items-center gap-4 sm:items-start">
        <div className="flex flex-col items-center sm:items-start">
          <span className="text-xl font-bold sm:text-2xl">{name}</span>
          {subtitle && <span className="text-base">{subtitle}</span>}
        </div>
        {meta && (
          <div className="flex flex-col items-center gap-1 text-center text-xs text-neutral-500 theme-fade-text sm:items-start sm:text-left dark:text-neutral-400">
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
