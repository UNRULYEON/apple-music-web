import type { QueryClient } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import { readStorage, removeStorage, writeStorage } from "@/lib/storage/local";

const STORAGE_KEY = "demo-mode";

export const DEMO_QUERY_KEY = ["music-kit", "demo"];

let isOn = readStored();
const listeners = new Set<() => void>();

export function useDemoMode(): boolean {
  return useSyncExternalStore(subscribeToDemoMode, readDemoMode, readServerDemoMode);
}

export function readDemoMode(): boolean {
  return isOn;
}

export function setDemoMode(next: boolean): void {
  if (next === isOn) {
    return;
  }

  isOn = next;
  writeStored(next);

  for (const listener of listeners) {
    listener();
  }
}

export function demoQueryKey(name: string): string[] {
  return [...DEMO_QUERY_KEY, name];
}

export function removeDemoQueries(client: QueryClient): void {
  client.removeQueries({ queryKey: DEMO_QUERY_KEY });
}

export function subscribeToDemoMode(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function readServerDemoMode(): boolean {
  return false;
}

function readStored(): boolean {
  return readStorage(STORAGE_KEY) === "true";
}

function writeStored(next: boolean): void {
  if (next) {
    writeStorage(STORAGE_KEY, "true");
  } else {
    removeStorage(STORAGE_KEY);
  }
}
