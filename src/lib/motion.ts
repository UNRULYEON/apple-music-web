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

export const TRANSITION_SLOW = { duration: 0.4, ease: EASE } as const;
