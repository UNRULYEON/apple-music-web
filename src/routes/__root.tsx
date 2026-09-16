import { TanStackDevtools, type TanStackDevtoolsReactPlugin } from "@tanstack/react-devtools";
import { hotkeysDevtoolsPlugin } from "@tanstack/react-hotkeys-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import {
  BackButton,
  CommandMenu,
  DrmNotice,
  MainContent,
  MusicKitDevtools,
  MusicKitGate,
  NotificationNotice,
  Player,
  PlayerDevtools,
  SearchInput,
  SidebarToggle,
} from "@/components";
import { Nav } from "@/components/nav";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToastProvider } from "@/components/ui/toast";
import {
  BackdropProvider,
  PlayerProvider,
  SearchProvider,
  SidebarProvider,
  ThemeProvider,
} from "@/contexts";
import TanStackQueryDevtools from "@/integrations/tanstack-query/devtools";
import { BAR_INSET } from "@/lib/layout";
import { preHydrationScript as nodeShimPreHydrationScript } from "@/lib/music-kit/node-shim";
import { SCROLL_AREA_ID } from "@/lib/scroll-area";
import { preHydrationScript as sidebarPreHydrationScript } from "@/lib/sidebar-storage";
import { preHydrationScript as themePreHydrationScript } from "@/lib/theme-storage";
import { cn } from "@/lib/utils";
import appCss from "@/styles.css?url";

const DEV_NAME_SUFFIX = import.meta.env.DEV ? " [dev]" : "";
const DEV_ASSET_SUFFIX = import.meta.env.DEV ? "-dev" : "";

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
        title: `Music${DEV_NAME_SUFFIX}`,
      },
      {
        name: "description",
        content: "Listen to music from Apple Music in your browser.",
      },
      {
        name: "apple-mobile-web-app-capable",
        content: "yes",
      },
      {
        name: "mobile-web-app-capable",
        content: "yes",
      },
      {
        name: "apple-mobile-web-app-title",
        content: `Music Web${DEV_NAME_SUFFIX}`,
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "manifest",
        href: `/manifest${DEV_ASSET_SUFFIX}.webmanifest`,
      },
      {
        rel: "apple-touch-icon",
        href: `/apple-touch-icon${DEV_ASSET_SUFFIX}.png`,
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "192x192",
        href: `/icon${DEV_ASSET_SUFFIX}-192.png`,
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
        <div className="relative isolate flex h-svh flex-col bg-background">
          <BackdropProvider>
            <ThemeProvider>
              <SidebarProvider>
                <ToastProvider position="top-center">
                  <PlayerProvider>
                    <DrmNotice />
                    <NotificationNotice />
                    <MusicKitGate>
                      <SearchProvider>
                        <Nav />
                        <div className="relative flex min-h-0 min-w-0 grow flex-col gap-2">
                          <div
                            className={cn("flex items-center gap-2 bg-transparent py-2", BAR_INSET)}
                          >
                            <SidebarToggle />
                            <BackButton />
                            <SearchInput />
                          </div>
                          <ScrollArea
                            className="min-w-0 flex-1"
                            fill
                            scrollFade
                            horizontal={false}
                            scrollRestorationId={SCROLL_AREA_ID}
                          >
                            <MainContent>{children}</MainContent>
                          </ScrollArea>
                          <Player />
                        </div>
                        <CommandMenu />
                      </SearchProvider>
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
