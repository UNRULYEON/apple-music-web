import { Skeleton } from "@/components/ui/skeleton";
import { TRANSITION_REVEAL } from "@/lib/motion";
import { artworkUrl, type Artwork } from "@/lib/music-kit/resource";
import { cn } from "@/lib/utils";
import { MusicNote02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useState } from "react";

const BOX = "relative aspect-square w-full overflow-hidden select-none";
const BLURRED = { opacity: 0, filter: "blur(2px)" };
const SHARP = { opacity: 1, filter: "blur(0px)" };

export function ArtworkImage({
  artwork,
  alt = "",
  size,
  iconSize = 64,
  className,
}: {
  artwork?: Artwork;
  alt?: string;
  size: number;
  iconSize?: number;
  className?: string;
}) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const reduceMotion = useReducedMotion();

  // a cached image can finish before react attaches onLoad
  const settle = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete) {
      setStatus(img.naturalWidth > 0 ? "loaded" : "error");
    }
  }, []);

  if (!artwork || status === "error") {
    return (
      <div className={cn(BOX, "flex items-center justify-center bg-muted", className)}>
        <HugeiconsIcon icon={MusicNote02Icon} size={iconSize} className="text-muted-foreground" />
      </div>
    );
  }

  const isLoaded = status === "loaded";
  const transition = reduceMotion ? { duration: 0 } : TRANSITION_REVEAL;

  return (
    <div className={cn(BOX, className)}>
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            key="placeholder"
            className="absolute inset-0"
            exit={BLURRED}
            transition={transition}
          >
            <Skeleton className="size-full rounded-none" />
          </motion.div>
        )}
      </AnimatePresence>
      <motion.img
        ref={settle}
        src={artworkUrl(artwork, size)}
        alt={alt}
        draggable={false}
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
        className="absolute inset-0 size-full object-cover outline-neutral-50/50 outline-1 -outline-offset-1 dark:outline-neutral-900/50"
        initial={BLURRED}
        animate={isLoaded ? SHARP : BLURRED}
        transition={transition}
      />
    </div>
  );
}
