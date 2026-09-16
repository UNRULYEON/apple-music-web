import { useCallback, useSyncExternalStore } from "react";
import { BREAKPOINTS } from "@/lib/layout";

type Breakpoint = keyof typeof BREAKPOINTS;

type MediaQuery = Breakpoint | `max-${Breakpoint}` | `(${string})`;

function toMediaQuery(query: MediaQuery): string {
  if (query.startsWith("(")) {
    return query;
  }

  if (query.startsWith("max-")) {
    return `(max-width: ${BREAKPOINTS[query.slice(4) as Breakpoint] - 1}px)`;
  }

  return `(min-width: ${BREAKPOINTS[query as Breakpoint]}px)`;
}

export function useMediaQuery(query: MediaQuery): boolean {
  const mediaQuery = toMediaQuery(query);

  const subscribe = useCallback(
    (listener: () => void) => {
      if (typeof window === "undefined") {
        return () => {};
      }

      const list = window.matchMedia(mediaQuery);
      list.addEventListener("change", listener);

      return () => list.removeEventListener("change", listener);
    },
    [mediaQuery],
  );

  const readMatches = useCallback(
    () => typeof window !== "undefined" && window.matchMedia(mediaQuery).matches,
    [mediaQuery],
  );

  return useSyncExternalStore(subscribe, readMatches, readMatches);
}

export function useIsMobile(): boolean {
  return useMediaQuery("max-md");
}
