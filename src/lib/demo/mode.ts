import { useSyncExternalStore } from "react";

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
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeStored(next: boolean): void {
  try {
    if (next) {
      localStorage.setItem(STORAGE_KEY, "true");
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {}
}
