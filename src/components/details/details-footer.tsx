import { totalDuration } from "@/lib/format";
import type { Song } from "@/lib/music-kit/track";
import type { ReactNode } from "react";

export function DetailsFooter({
  songs,
  trackCount = songs.length,
  children,
}: {
  songs: Song[];
  trackCount?: number;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 items-center text-xs text-neutral-400">
      <span>
        {trackCount} {trackCount === 1 ? "track" : "tracks"} • {totalDuration(songs)}
      </span>
      {children}
    </div>
  );
}
