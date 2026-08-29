import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { routeTree } from "./routeTree.gen";
import { getContext } from "./integrations/tanstack-query/root-provider";
import { Spinner } from "@/components/ui/spinner";
import { createMusicKitAuth } from "@/lib/music-kit/auth";

export function getRouter() {
  const context = { ...getContext(), auth: createMusicKitAuth() };

  const router = createTanStackRouter({
    routeTree,
    context,
    scrollRestoration: true,
    defaultPendingComponent: PendingScreen,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
  });

  setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient });

  return router;
}

function PendingScreen() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Spinner className="size-6" />
    </div>
  );
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
