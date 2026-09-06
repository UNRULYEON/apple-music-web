import { ArtworkImage } from "@/components/artwork";
import { usePlayer } from "@/hooks";
import { songDuration } from "@/lib/format";
import { isSameSource, type QueueSource } from "@/lib/music-kit/playback";
import type { Song } from "@/lib/music-kit/track";
import { PlayIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const ARTWORK_SIZE = 48;

export function TrackList({
  songs,
  primaryArtist,
  showTrackNumber = true,
  showArtwork = false,
  source,
}: {
  songs: Song[];
  primaryArtist?: string;
  showTrackNumber?: boolean;
  showArtwork?: boolean;
  source?: QueueSource;
}) {
  const { play, source: playingFrom, nowPlaying } = usePlayer();
  const playsThisList = isSameSource(source, playingFrom);

  return (
    <div className="flex flex-col">
      {songs.map((song, i) => (
        <button
          key={`${song.id}-${i}`}
          type="button"
          onClick={() => play(songs, { startAt: i, from: source })}
          className="flex items-center text-left gap-4 px-2 sm:px-4 h-14 sm:h-16 hover:bg-neutral-600/15 hover:dark:bg-neutral-400/15 cursor-pointer rounded-xl backdrop-blur-3xl"
        >
          <span className="flex min-w-6 items-center justify-center tabular-nums text-sm text-neutral-600 dark:text-neutral-400">
            {playsThisList && nowPlaying?.id === song.id ? (
              <HugeiconsIcon
                icon={PlayIcon}
                size={14}
                strokeWidth={2}
                aria-label="Playing now"
                className="text-neutral-900 dark:text-neutral-100"
              />
            ) : showTrackNumber ? (
              i + 1
            ) : null}
          </span>
          {showArtwork && (
            <ArtworkImage
              artwork={song.artwork}
              size={ARTWORK_SIZE}
              iconSize={20}
              className="size-10 shrink-0 rounded-md"
            />
          )}
          <div className="flex flex-col grow min-w-0">
            <span className="truncate">{song.name}</span>
            <span className="truncate text-sm text-neutral-600 dark:text-neutral-400">
              {song.artist?.name !== primaryArtist ? song.artist?.name : ""}
            </span>
          </div>
          <div className="text-sm tabular-nums text-neutral-600 dark:text-neutral-400">
            {song.durationInMillis ? songDuration(song.durationInMillis) : null}
          </div>
        </button>
      ))}
    </div>
  );
}
