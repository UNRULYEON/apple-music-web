const EASE = [0.16, 1, 0.3, 1] as const;

export const TRANSITION = { duration: 0.24, ease: EASE } as const;
export const TRANSITION_SLOW = { duration: 0.7, ease: EASE } as const;

// skeleton -> content reveal
export const TRANSITION_REVEAL = { duration: 0.4, ease: EASE } as const;
