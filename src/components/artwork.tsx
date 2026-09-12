import { Skeleton } from "@/components/ui/skeleton";
import { TRANSITION_REVEAL } from "@/lib/motion";
import { artworkUrl, type Artwork } from "@/lib/music-kit/resource";
import { cn } from "@/lib/utils";
import { MusicNote02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useRef, useState } from "react";

const BOX = "relative aspect-square w-full overflow-hidden select-none";
const BLURRED = { opacity: 0, filter: "blur(2px)" };
const SHARP = { opacity: 1, filter: "blur(0px)" };

// the pictures a person has already been shown. A long list keeps only the rows in
// sight, so a row that comes back would reveal its picture again, which reads as the
// list flashing while it scrolls.
const shown = new Set<string>();

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
  const url = artwork ? artworkUrl(artwork, size) : undefined;
  const wasShown = useRef(url !== undefined && shown.has(url)).current;
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    wasShown ? "loaded" : "loading",
  );
  const reduceMotion = useReducedMotion();

  const load = useCallback(() => {
    if (url) {
      shown.add(url);
    }

    setStatus("loaded");
  }, [url]);

  // a cached image can finish before react attaches onLoad
  const settle = useCallback(
    (img: HTMLImageElement | null) => {
      if (!img?.complete) {
        return;
      }

      if (img.naturalWidth > 0) {
        load();
        return;
      }

      setStatus("error");
    },
    [load],
  );

  if (!artwork || !url || status === "error") {
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
        src={url}
        alt={alt}
        draggable={false}
        onLoad={load}
        onError={() => setStatus("error")}
        className={cn(
          "absolute inset-0 size-full object-cover outline-artwork-outline outline-1 -outline-offset-1",
          className,
        )}
        initial={wasShown ? SHARP : BLURRED}
        animate={isLoaded ? SHARP : BLURRED}
        transition={transition}
      />
    </div>
  );
}
