import { DetailsArtwork } from "@/components/details/details-artwork";
import type { Artwork } from "@/lib/music-kit/resource";
import type { ReactNode } from "react";

export function DetailsHeader({
  artwork,
  name,
  subtitle,
  meta,
}: {
  artwork?: Artwork;
  name: string;
  subtitle?: string;
  meta?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-8 sm:gap-4 sm:flex-row items-center">
      <div className="w-full max-w-96 sm:w-72 sm:shrink-0 sm:px-4">
        <DetailsArtwork artwork={artwork} name={name} />
      </div>
      <div className="flex flex-col gap-2 items-center sm:items-start">
        <div className="flex flex-col items-center sm:items-start">
          <span className="font-bold text-xl sm:text-2xl">{name}</span>
          {subtitle && <span className="text-base">{subtitle}</span>}
        </div>
        {meta && (
          <div className="flex flex-col gap-1 items-center sm:items-start text-center sm:text-left text-xs text-neutral-500 dark:text-neutral-400">
            {meta}
          </div>
        )}
      </div>
    </div>
  );
}
