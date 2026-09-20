// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type DevtoolsCommands,
  exposeDevtoolsCommands,
  readDevtools,
  readStoredDevtools,
  setDevtools,
  subscribeToDevtools,
} from "@/lib/devtools";
import { STORAGE_KEYS } from "@/lib/storage/keys";

afterEach(() => {
  setDevtools(false);
  localStorage.clear();
});

describe("readStoredDevtools", () => {
  it("follows the stored choice", () => {
    expect(readStoredDevtools("true")).toBe(true);
    expect(readStoredDevtools("false")).toBe(false);
  });

  it("is on in development and off in production when nothing is stored", () => {
    expect(readStoredDevtools(undefined)).toBe(import.meta.env.DEV);
  });
});

describe("setDevtools", () => {
  it("keeps the choice in the browser", () => {
    setDevtools(true);
    expect(localStorage.getItem(STORAGE_KEYS.devtools)).toBe("true");

    setDevtools(false);
    expect(localStorage.getItem(STORAGE_KEYS.devtools)).toBe("false");
  });

  it("tells a listener only when the state changes", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToDevtools(listener);

    setDevtools(true);
    setDevtools(true);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    setDevtools(false);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("exposeDevtoolsCommands", () => {
  it("turns the devtools on and off from the console", () => {
    exposeDevtoolsCommands();
    const commands = (globalThis as unknown as { devtools: DevtoolsCommands }).devtools;

    expect(commands.on()).toBe("Devtools are on.");
    expect(readDevtools()).toBe(true);

    expect(commands.off()).toBe("Devtools are off.");
    expect(readDevtools()).toBe(false);
  });
});
