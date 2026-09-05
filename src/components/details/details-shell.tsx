import { LoadingState } from "@/components/loading-state";
import { useBackdrop } from "@/hooks";
import { TRANSITION_SLOW } from "@/lib/motion";
import type { Artwork } from "@/lib/music-kit/resource";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, type ReactNode } from "react";

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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={TRANSITION_SLOW}
        >
          <LoadingState />
        </motion.div>
      )}
      {children && !isPending && (
        <motion.div
          key={`${id}-loaded`}
          className="flex flex-col grow gap-8 px-4 py-4 sm:py-8 sm:px-4 sm:gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={TRANSITION_SLOW}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
