import { lazy, Suspense, useEffect } from "react";
import { useDevtools } from "@/hooks";
import { exposeDevtoolsCommands } from "@/lib/devtools";

const DevtoolsPanel = lazy(() =>
  import("./devtools-panel").then((module) => ({ default: module.DevtoolsPanel })),
);

export function Devtools() {
  const isShown = useDevtools();

  useEffect(exposeDevtoolsCommands, []);

  if (!isShown) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <DevtoolsPanel />
    </Suspense>
  );
}
