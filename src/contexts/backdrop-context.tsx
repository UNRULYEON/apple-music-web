import { EASE } from "@/lib/motion";
import { MeshGradient } from "@paper-design/shaders-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { createContext, useState, type ReactNode } from "react";

export type SetBackdropColors = (colors: string[] | undefined) => void;

const WASH = { duration: 10, ease: EASE, delay: 2 } as const;
const NO_WASH = { duration: 0 } as const;

export const BackdropContext = createContext<SetBackdropColors | undefined>(undefined);

export function BackdropProvider({ children }: { children: ReactNode }) {
  const [colors, setColors] = useState<string[]>();
  const prefersReducedMotion = useReducedMotion();
  const wash = prefersReducedMotion ? NO_WASH : WASH;

  return (
    <BackdropContext.Provider value={setColors}>
      <AnimatePresence>
        {colors && (
          <motion.div
            key="backdrop"
            className="fixed inset-0 -z-10 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2, transition: wash }}
            exit={{ opacity: 0 }}
          >
            <MeshGradient
              className="size-full"
              colors={colors}
              distortion={0}
              swirl={0}
              grainMixer={1}
              grainOverlay={1}
              speed={1}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </BackdropContext.Provider>
  );
}
