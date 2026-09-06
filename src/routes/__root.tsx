import { HeadContent, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

import TanStackQueryDevtools from "@/integrations/tanstack-query/devtools";
import { MusicKitDevtools } from "@/components/music-kit-devtools";
import { MusicKitGate } from "@/components/music-kit-gate";

import appCss from "../styles.css?url";

import type { QueryClient } from "@tanstack/react-query";
import type { TanStackDevtoolsReactPlugin } from "@tanstack/react-devtools";
import { BackButton, MainContent, Nav, Player, SidebarToggle } from "@/components";
import { BackdropProvider, PlayerProvider, SidebarProvider, ThemeProvider } from "@/contexts";
import { preHydrationScript as sidebarPreHydrationScript } from "@/lib/sidebar-storage";
import { preHydrationScript as themePreHydrationScript } from "@/lib/theme-storage";
import { ScrollArea } from "@/components/ui/scroll-area";
import { hotkeysDevtoolsPlugin } from "@tanstack/react-hotkeys-devtools";

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
        <div className="isolate relative flex flex-col h-svh bg-background">
          <BackdropProvider>
            <ThemeProvider>
              <SidebarProvider>
                <PlayerProvider>
                  <MusicKitGate>
                    <Nav />
                    <div className="relative flex flex-col grow min-w-0 min-h-0">
                      <div className="flex p-2 gap-2 bg-transparent">
                        <SidebarToggle />
                        <BackButton />
                      </div>
                      <ScrollArea className="flex-1 min-w-0" fill scrollFade>
                        <MainContent>{children}</MainContent>
                      </ScrollArea>
                      <Player />
                    </div>
                  </MusicKitGate>
                </PlayerProvider>
              </SidebarProvider>
            </ThemeProvider>
          </BackdropProvider>
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
            hotkeysDevtoolsPlugin(),
            ...(import.meta.env.DEV ? [appleAuthDevtools] : []),
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
