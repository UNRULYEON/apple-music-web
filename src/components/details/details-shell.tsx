import { LoadingState } from "@/components/loading-state";
import { useBackdrop } from "@/hooks";
import { TRANSITION_REVEAL } from "@/lib/motion";
import type { Artwork } from "@/lib/music-kit/resource";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, type ReactNode } from "react";

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
  const colors = useMemo(
    () =>
      [
        artwork?.bgColor,
        artwork?.textColor1,
        artwork?.textColor2,
        artwork?.textColor3,
        artwork?.textColor4,
      ].filter((color) => color !== undefined),
    [artwork],
  );

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
          className="flex flex-col grow gap-8 px-4 py-4 sm:py-8 sm:px-4 sm:gap-8"
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
