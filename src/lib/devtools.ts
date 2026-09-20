import { createListeners } from "@/lib/listeners";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import { readStorage, writeStorage } from "@/lib/storage/local";

export interface DevtoolsCommands {
  on: () => string;
  off: () => string;
}

const STORAGE_KEY = STORAGE_KEYS.devtools;
const COMMAND_NAME = "devtools";

let isOn = readStoredDevtools(readStorage(STORAGE_KEY));
const listeners = createListeners();

export function readStoredDevtools(stored: string | undefined): boolean {
  return stored === undefined ? import.meta.env.DEV : stored === "true";
}

export function readDevtools(): boolean {
  return isOn;
}

export function setDevtools(next: boolean): void {
  if (next === isOn) {
    return;
  }

  isOn = next;
  writeStored(next);

  listeners.notify();
}

export function subscribeToDevtools(listener: () => void): () => void {
  return listeners.subscribe(listener);
}

export function readInitialDevtools(): boolean {
  return false;
}

export function exposeDevtoolsCommands(): void {
  const commands: DevtoolsCommands = {
    on() {
      setDevtools(true);
      return "Devtools are on.";
    },
    off() {
      setDevtools(false);
      return "Devtools are off.";
    },
  };

  Object.defineProperty(globalThis, COMMAND_NAME, {
    value: commands,
    configurable: true,
    writable: true,
  });
}

function writeStored(next: boolean): void {
  writeStorage(STORAGE_KEY, String(next));
}
