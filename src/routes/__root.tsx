import { HeadContent, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

import TanStackQueryDevtools from "@/integrations/tanstack-query/devtools";
import { MusicKitDevtools } from "@/components/music-kit-devtools";
import { MusicKitGate } from "@/components/music-kit-gate";

import appCss from "../styles.css?url";

import type { QueryClient } from "@tanstack/react-query";
import type { TanStackDevtoolsReactPlugin } from "@tanstack/react-devtools";
import { BackButton, Nav, SidebarToggle } from "@/components";
import { BackdropProvider, SidebarProvider, ThemeProvider } from "@/contexts";
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
                <MusicKitGate>
                  <Nav />
                  <div className="flex flex-col grow">
                    <div className="flex p-2 gap-2 bg-transparent">
                      <SidebarToggle />
                      <BackButton />
                    </div>
                    <ScrollArea className="flex-1 min-w-0" fill scrollFade>
                      <main className="flex min-h-full">{children}</main>
                    </ScrollArea>
                  </div>
                </MusicKitGate>
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
