import type { ReactNode } from "react";
import { count, totalDuration } from "@/lib/format";
import type { Song } from "@/lib/music-kit/track";

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
    <div className="flex flex-col items-center gap-0.5 text-xs text-neutral-500 theme-fade-text dark:text-neutral-400">
      <span>
        {count(trackCount, "track")} • {totalDuration(songs)}
      </span>
      {children}
    </div>
  );
}
