import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useMemo } from "react";
import { LoadingState } from "@/components";
import { useBackdrop } from "@/hooks";
import { VIEW_INSET } from "@/lib/layout";
import { TRANSITION_REVEAL } from "@/lib/motion";
import { type Artwork, artworkColors } from "@/lib/music-kit/resource";
import { cn } from "@/lib/utils";

const BLURRED = { opacity: 0, filter: "blur(2px)" };
const SHARP = { opacity: 1, filter: "blur(0px)" };

export function DetailsShell({
  id,
  artwork,
  isPending,
  children,
}: {
  id: string;
  artwork?: Artwork;
  isPending: boolean;
  children: ReactNode;
}) {
  const colors = useMemo(() => artworkColors(artwork), [artwork]);

  useBackdrop(colors.length > 0 ? colors : undefined);

  return (
    <AnimatePresence mode="popLayout">
      {isPending && (
        <motion.div
          key={`${id}-loading`}
          className="flex grow"
          initial={BLURRED}
          animate={SHARP}
          exit={BLURRED}
          transition={TRANSITION_REVEAL}
        >
          <LoadingState />
        </motion.div>
      )}
      {children && !isPending && (
        <motion.div
          key={`${id}-loaded`}
          className={cn("flex min-w-0 grow flex-col gap-8 py-4 sm:gap-8 sm:py-8", VIEW_INSET)}
          initial={BLURRED}
          animate={SHARP}
          exit={BLURRED}
          transition={TRANSITION_REVEAL}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
