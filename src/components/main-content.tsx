import { PLAYER_SPACE } from "@/components/player";
import { usePlayer } from "@/hooks";
import { TRANSITION, TRANSITION_REVEAL } from "@/lib/motion";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

export function MainContent({ children }: { children: ReactNode }) {
  const { nowPlaying } = usePlayer();
  const prefersReducedMotion = useReducedMotion();
  const isShown = Boolean(nowPlaying);

  return (
    <motion.main
      className="flex min-h-full"
      initial={false}
      animate={{ paddingBottom: isShown ? PLAYER_SPACE : 0 }}
      transition={prefersReducedMotion ? { duration: 0 } : isShown ? TRANSITION_REVEAL : TRANSITION}
    >
      {children}
    </motion.main>
  );
}
