import { TanStackDevtools, type TanStackDevtoolsReactPlugin } from "@tanstack/react-devtools";
import { hotkeysDevtoolsPlugin } from "@tanstack/react-hotkeys-devtools";
import { createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import type { ReactNode } from "react";
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
import { queryDevtools } from "@/integrations/tanstack-query/devtools";
import type { RouterContext } from "@/integrations/tanstack-query/root-provider";
import { BAR_INSET } from "@/lib/layout";
import { PRE_HYDRATION_SCRIPT as NODE_SHIM_SCRIPT } from "@/lib/music-kit/node-shim";
import { SCROLL_AREA_ID } from "@/lib/scroll-area";
import { MIGRATION_SCRIPT } from "@/lib/storage/keys";
import { PRE_HYDRATION_SCRIPT as SIDEBAR_SCRIPT } from "@/lib/storage/sidebar";
import { PRE_HYDRATION_SCRIPT as THEME_SCRIPT } from "@/lib/storage/theme";
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

export const Route = createRootRouteWithContext<RouterContext>()({
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
        children: MIGRATION_SCRIPT,
      },
      {
        children: THEME_SCRIPT,
      },
      {
        children: SIDEBAR_SCRIPT,
      },
      {
        children: NODE_SHIM_SCRIPT,
      },
      {
        src: "https://js-cdn.music.apple.com/musickit/v3/musickit.js",
        async: true,
      },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: ReactNode }) {
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
                        queryDevtools,
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
