import { ArtworkImage } from "@/components/artwork";
import { songDuration } from "@/lib/format";
import type { Song } from "@/lib/music-kit/track";

const ARTWORK_SIZE = 48;

export function TrackList({
  songs,
  primaryArtist,
  showTrackNumber = true,
  showArtwork = false,
}: {
  songs: Song[];
  primaryArtist?: string;
  showTrackNumber?: boolean;
  showArtwork?: boolean;
}) {
  return (
    <div className="flex flex-col">
      {songs.map((song, i) => (
        <div
          key={song.id}
          className="flex items-center gap-4 px-2 sm:px-4 h-14 sm:h-16 hover:bg-neutral-600/15 hover:dark:bg-neutral-400/15 cursor-pointer rounded-xl backdrop-blur-3xl"
        >
          {showTrackNumber && (
            <span className="min-w-6 tabular-nums text-sm text-center text-neutral-600 dark:text-neutral-400">
              {i + 1}
            </span>
          )}
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
        </div>
      ))}
    </div>
  );
}
