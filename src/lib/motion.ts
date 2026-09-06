const EASE = [0.16, 1, 0.3, 1] as const;

export const TRANSITION = { duration: 0.24, ease: EASE } as const;

// panel open, skeleton -> content reveal
export const TRANSITION_REVEAL = { duration: 0.4, ease: EASE } as const;

// song -> song text and artwork swap
export const TRANSITION_SWAP = { duration: 0.15, ease: EASE } as const;

// the sidebar and the ambient artwork wash
export const TRANSITION_SLOW = { duration: 0.7, ease: EASE } as const;
