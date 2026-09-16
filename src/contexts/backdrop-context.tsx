import { MeshGradient } from "@paper-design/shaders-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { createContext, type ReactNode, useState } from "react";
import { EASE } from "@/lib/motion";

export type SetBackdropColors = (colors: string[] | undefined) => void;

const WASH = { duration: 10, ease: EASE, delay: 2 } as const;
const BACKDROP_PIXELS = 1280 * 720;
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
            className="pointer-events-none fixed inset-0 -z-10"
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
              minPixelRatio={1}
              maxPixelCount={BACKDROP_PIXELS}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </BackdropContext.Provider>
  );
}
