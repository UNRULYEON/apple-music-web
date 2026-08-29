import { HeadContent, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import { MusicKitDevtools } from "@/components/music-kit-devtools";
import { MusicKitGate } from "@/components/music-kit-gate";

import appCss from "../styles.css?url";

import type { QueryClient } from "@tanstack/react-query";
import type { TanStackDevtoolsReactPlugin } from "@tanstack/react-devtools";

const appleAuthDevtools: TanStackDevtoolsReactPlugin = {
  id: "apple-auth",
  name: "Apple Authentication",
  render: (_element, props) => <MusicKitDevtools theme={props.theme} />,
};

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "TanStack Start Starter",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
    scripts: [
      {
        src: "https://js-cdn.music.apple.com/musickit/v3/musickit.js",
        async: true,
      },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="relative">
        <MusicKitGate>{children}</MusicKitGate>
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
            ...(import.meta.env.DEV ? [appleAuthDevtools] : []),
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
