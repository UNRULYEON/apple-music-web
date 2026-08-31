import { HeadContent, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

import TanStackQueryDevtools from "@/integrations/tanstack-query/devtools";
import { MusicKitDevtools } from "@/components/music-kit-devtools";
import { MusicKitGate } from "@/components/music-kit-gate";

import appCss from "../styles.css?url";

import type { QueryClient } from "@tanstack/react-query";
import type { TanStackDevtoolsReactPlugin } from "@tanstack/react-devtools";
import { Nav } from "@/components";
import { SidebarProvider, ThemeProvider } from "@/contexts";
import { preHydrationScript as sidebarPreHydrationScript } from "@/lib/sidebar-storage";
import { preHydrationScript as themePreHydrationScript } from "@/lib/theme-storage";

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
        children: themePreHydrationScript,
      },
      {
        children: sidebarPreHydrationScript,
      },
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="relative overflow-clip">
        <div className="isolate relative flex flex-col grow min-h-svh bg-background">
          <ThemeProvider>
            <SidebarProvider>
              <MusicKitGate>
                <Nav />
                <main className="flex grow">{children}</main>
              </MusicKitGate>
            </SidebarProvider>
          </ThemeProvider>
        </div>
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
