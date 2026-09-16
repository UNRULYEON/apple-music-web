import { useSyncExternalStore } from "react";
import { readDemoMode, readInitialDemoMode, subscribeToDemoMode } from "@/lib/demo/mode";

export function useDemoMode(): boolean {
  return useSyncExternalStore(subscribeToDemoMode, readDemoMode, readInitialDemoMode);
}
