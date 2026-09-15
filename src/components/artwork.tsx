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
const FADED = { opacity: 0 };
const OPAQUE = { opacity: 1 };

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
  blurs = true,
}: {
  artwork?: Artwork;
  alt?: string;
  size: number;
  iconSize?: number;
  className?: string;
  blurs?: boolean;
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
  const hidden = blurs && !reduceMotion ? BLURRED : FADED;
  const visible = blurs && !reduceMotion ? SHARP : OPAQUE;

  return (
    <div className={cn(BOX, className)}>
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            key="placeholder"
            className="absolute inset-0"
            exit={hidden}
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
        className={cn("absolute inset-0 size-full object-cover", className)}
        initial={wasShown ? visible : hidden}
        animate={isLoaded ? visible : hidden}
        transition={transition}
      />
    </div>
  );
}
