import { animate } from "motion";
import { EASE, readReducedMotion, TRANSITION_REVEAL } from "@/lib/motion";

export const SCROLL_AREA_ID = "main";

export const SCROLL_VIEWPORT = '[data-slot="scroll-area-viewport"]';

export const SCROLL_AREA = `[data-scroll-restoration-id="${SCROLL_AREA_ID}"]`;

const GLIDE = TRANSITION_REVEAL.duration;

export function startAtTop(): void {
  requestAnimationFrame(() => {
    const area = document.querySelector(SCROLL_AREA);

    if (!area || area.scrollTop === 0) {
      return;
    }

    if (readReducedMotion()) {
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
