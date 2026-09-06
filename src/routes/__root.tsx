import { HeadContent, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

import TanStackQueryDevtools from "@/integrations/tanstack-query/devtools";
import { MusicKitDevtools } from "@/components/music-kit-devtools";
import { PlayerDevtools } from "@/components/player-devtools";
import { MusicKitGate } from "@/components/music-kit-gate";

import appCss from "../styles.css?url";

import type { QueryClient } from "@tanstack/react-query";
import type { TanStackDevtoolsReactPlugin } from "@tanstack/react-devtools";
import { BackButton, DrmNotice, MainContent, Nav, Player, SidebarToggle } from "@/components";
import { BackdropProvider, PlayerProvider, SidebarProvider, ThemeProvider } from "@/contexts";
import { preHydrationScript as sidebarPreHydrationScript } from "@/lib/sidebar-storage";
import { preHydrationScript as themePreHydrationScript } from "@/lib/theme-storage";
import { preHydrationScript as nodeShimPreHydrationScript } from "@/lib/music-kit/node-shim";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToastProvider } from "@/components/ui/toast";
import { hotkeysDevtoolsPlugin } from "@tanstack/react-hotkeys-devtools";

const appleAuthDevtools: TanStackDevtoolsReactPlugin = {
  id: "apple-auth",
  name: "Apple Authentication",
  render: (_element, props) => <MusicKitDevtools theme={props.theme} />,
};

const playerDevtools: TanStackDevtoolsReactPlugin = {
  id: "player",
  name: "Player",
  render: (_element, props) => <PlayerDevtools theme={props.theme} />,
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
        children: nodeShimPreHydrationScript,
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
                <ToastProvider position="top-center">
                  <PlayerProvider>
                    <DrmNotice />
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
                        ...(import.meta.env.DEV ? [appleAuthDevtools, playerDevtools] : []),
                      ]}
                    />
                  </PlayerProvider>
                </ToastProvider>
              </SidebarProvider>
            </ThemeProvider>
          </BackdropProvider>
        </div>
        <Scripts />
      </body>
    </html>
  );
}
