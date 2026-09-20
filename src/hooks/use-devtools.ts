import { useSyncExternalStore } from "react";
import { readDevtools, readInitialDevtools, subscribeToDevtools } from "@/lib/devtools";

export function useDevtools(): boolean {
  return useSyncExternalStore(subscribeToDevtools, readDevtools, readInitialDevtools);
}
