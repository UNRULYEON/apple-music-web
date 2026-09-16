import { EASE, TRANSITION_REVEAL } from "@/lib/motion";
import { animate } from "motion";

export const SCROLL_AREA_ID = "main";

export const SCROLL_AREA = `[data-scroll-restoration-id="${SCROLL_AREA_ID}"]`;

const GLIDE = TRANSITION_REVEAL.duration;

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function wantsNoMotion(): boolean {
  return window.matchMedia?.(REDUCED_MOTION).matches === true;
}

export function startAtTop(): void {
  requestAnimationFrame(() => {
    const area = document.querySelector(SCROLL_AREA);

    if (!area || area.scrollTop === 0) {
      return;
    }

    if (wantsNoMotion()) {
      area.scrollTop = 0;
      return;
    }

    animate(area.scrollTop, 0, {
      duration: GLIDE,
      ease: [...EASE],
      onUpdate: (top) => {
        area.scrollTop = top;
      },
    });
  });
}
