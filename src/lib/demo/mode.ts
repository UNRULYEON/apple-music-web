import type { QueryClient } from "@tanstack/react-query";
import { createListeners } from "@/lib/listeners";
import { readStorage, removeStorage, writeStorage } from "@/lib/storage/local";

const STORAGE_KEY = "demo-mode";

const DEMO_QUERY_KEY = ["music-kit", "demo"];

let isOn = readStored();
const listeners = createListeners();

export function readDemoMode(): boolean {
  return isOn;
}

export function setDemoMode(next: boolean): void {
  if (next === isOn) {
    return;
  }

  isOn = next;
  writeStored(next);

  listeners.notify();
}

export function demoQueryKey(name: string): string[] {
  return [...DEMO_QUERY_KEY, name];
}

export function removeDemoQueries(client: QueryClient): void {
  client.removeQueries({ queryKey: DEMO_QUERY_KEY });
}

export function subscribeToDemoMode(listener: () => void): () => void {
  return listeners.subscribe(listener);
}

export function readInitialDemoMode(): boolean {
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
