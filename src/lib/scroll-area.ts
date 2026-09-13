import { EASE, TRANSITION_REVEAL } from "@/lib/motion";
import { animate } from "motion";

// the one scroll area the shell keeps for every view. The router knows it by this name
// as well, so it can put a view back where a person left it.
export const SCROLL_AREA_ID = "main";

export const SCROLL_AREA = `[data-scroll-restoration-id="${SCROLL_AREA_ID}"]`;

const GLIDE = TRANSITION_REVEAL.duration;

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function wantsNoMotion(): boolean {
  return window.matchMedia?.(REDUCED_MOTION).matches === true;
}

// takes the view back to its start. It waits a frame, so it has the last word over the
// place the router puts a view back at.
//
// The app moves the list itself rather than asking the browser for a smooth scroll: a
// virtualized list measures its rows as they arrive, which moves the end of a scroll
// the browser is in the middle of and drops it back to a jump.
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
