const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function readReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia?.(REDUCED_MOTION_QUERY).matches === true
  );
}

export const EASE = [0.22, 1, 0.36, 1] as const;

export const TRANSITION = { duration: 0.25, ease: EASE } as const;

export const TRANSITION_CLOSE = { duration: 0.35, ease: EASE } as const;

export const TRANSITION_REVEAL = { duration: 0.4, ease: EASE } as const;

export const TRANSITION_SWAP = { duration: 0.15, ease: EASE } as const;

export const ROLL_DURATION = 240;

export const NO_TRANSITION = { duration: 0 } as const;

export const BLURRED = { opacity: 0, filter: "blur(2px)" };

export const SHARP = { opacity: 1, filter: "blur(0px)" };

export const FADED = { opacity: 0 };

export const OPAQUE = { opacity: 1 };

export const SHRUNK = { opacity: 0, scale: 0.96, filter: "blur(2px)" };

export const GROWN = { opacity: 1, scale: 1, filter: "blur(0px)" };
