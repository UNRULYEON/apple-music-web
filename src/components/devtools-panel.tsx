import { TanStackDevtools, type TanStackDevtoolsReactPlugin } from "@tanstack/react-devtools";
import { hotkeysDevtoolsPlugin } from "@tanstack/react-hotkeys-devtools";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { queryDevtools } from "@/integrations/tanstack-query/devtools";
import { MusicKitDevtools } from "./music-kit-devtools";
import { PlayerDevtools } from "./player-devtools";

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

export function DevtoolsPanel() {
  return (
    <TanStackDevtools
      config={{ position: "bottom-right" }}
      plugins={[
        {
          name: "Tanstack Router",
          render: <TanStackRouterDevtoolsPanel />,
        },
        queryDevtools,
        hotkeysDevtoolsPlugin(),
        appleAuthDevtools,
        playerDevtools,
      ]}
    />
  );
}
