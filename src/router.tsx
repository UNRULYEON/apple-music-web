import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { routeTree } from "./routeTree.gen";
import { getContext } from "./integrations/tanstack-query/root-provider";

import { SCROLL_AREA } from "@/lib/scroll-area";
import { HOME, isTopLevel, readView, viewKey, type View } from "@/lib/views/view";
import type { ParsedLocation } from "@tanstack/react-router";

function scrollRestorationKey(location: ParsedLocation): string {
  const view = readView(location.state.view) ?? HOME;

  // oxlint-disable-next-line no-underscore-dangle
  return isTopLevel(view) ? viewKey(view) : (location.state.__TSR_key ?? location.href);
}

export function getRouter() {
  const context = getContext();

  const router = createTanStackRouter({
    routeTree,
    context,
    scrollRestoration: true,
    scrollToTopSelectors: [SCROLL_AREA],
    getScrollRestorationKey: scrollRestorationKey,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
  });

  setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}

declare module "@tanstack/history" {
  interface HistoryState {
    view?: View;
  }
}
