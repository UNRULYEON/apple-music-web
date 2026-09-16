import { vi } from "vitest";

export function stubMatchMedia(matches: (query: string) => boolean): void {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: matches(query),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }));
}

export function stubViewport({
  mobile,
  prefersReducedMotion = false,
}: {
  mobile: boolean;
  prefersReducedMotion?: boolean;
}): void {
  stubMatchMedia((query) => {
    if (query.includes("prefers-reduced-motion")) {
      return prefersReducedMotion;
    }

    return mobile ? query.includes("max-width") : query.includes("min-width");
  });
}
