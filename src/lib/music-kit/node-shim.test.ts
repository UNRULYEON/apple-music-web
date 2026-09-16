import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { insistOnBrowser, preHydrationScript, withoutNodeMark } from "@/lib/music-kit/node-shim";

afterEach(() => {
  vi.unstubAllGlobals();
});

function run(): void {
  new Function(preHydrationScript)();
}

beforeEach(() => {
  vi.stubGlobal("localStorage", { setItem: () => {} });
});

describe("preHydrationScript", () => {
  it("asks MusicKit to fetch the next song early", () => {
    const items = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      setItem: (key: string, value: string) => items.set(key, value),
    });
    vi.stubGlobal("process", undefined);

    run();

    expect(items.get("mk-hlsjs-item-preloading")).toBe("1");
  });

  it("takes away the mark that makes MusicKit think it runs in Node", () => {
    const process = { versions: { node: "22.0.0", v8: "12.0" }, env: { MODE: "test" } };
    vi.stubGlobal("process", process);

    run();

    expect(process.versions.node).toBeUndefined();
    expect(process.versions.v8).toBe("12.0");
    expect(process.env).toEqual({ MODE: "test" });
  });

  it("leaves a browser without the shim alone", () => {
    vi.stubGlobal("process", undefined);

    expect(run).not.toThrow();
  });

  it("leaves a process without versions alone", () => {
    vi.stubGlobal("process", { env: {} });

    expect(run).not.toThrow();
  });
});

describe("withoutNodeMark", () => {
  it("hides the whole shim while MusicKit looks at the runtime", async () => {
    const shim = { versions: {}, env: { MODE: "test" } };
    vi.stubGlobal("process", shim);
    let seen: unknown = "not read";

    await withoutNodeMark(async () => {
      seen = Reflect.get(globalThis, "process");
    });

    expect(seen).toBeUndefined();
    expect(Reflect.get(globalThis, "process")).toBe(shim);
  });

  it("gives the shim back before anything else can run", async () => {
    const shim = { versions: {}, env: {} };
    vi.stubGlobal("process", shim);
    let duringMacrotask: unknown = "not read";

    const waiting = withoutNodeMark(
      () =>
        new Promise<string>((resolve) => {
          setTimeout(() => {
            duringMacrotask = Reflect.get(globalThis, "process");
            resolve("done");
          }, 0);
        }),
    );

    await expect(waiting).resolves.toBe("done");

    expect(duringMacrotask).toBe(shim);
  });

  it("gives the shim back when the work fails", async () => {
    const shim = { versions: {}, env: {} };
    vi.stubGlobal("process", shim);

    await expect(withoutNodeMark(() => Promise.reject(new Error("no token")))).rejects.toThrow(
      "no token",
    );

    expect(Reflect.get(globalThis, "process")).toBe(shim);
  });

  it("leaves a browser without the shim alone", async () => {
    vi.stubGlobal("process", undefined);

    await expect(withoutNodeMark(async () => "done")).resolves.toBe("done");
  });
});

function musicThatBelieves(isNodeEnvironment: boolean) {
  const config = { isNodeEnvironment };
  const music: Record<string, unknown> = {};

  Reflect.set(music, "_services", { runtime: { config } });

  return { config, music: music as unknown as MusicKit.MusicKitInstance };
}

describe("insistOnBrowser", () => {
  it("says browser to a MusicKit that decided it runs in Node", () => {
    const { config, music } = musicThatBelieves(true);

    insistOnBrowser(music);

    expect(config.isNodeEnvironment).toBe(false);
  });

  it("leaves a MusicKit that knows better alone", () => {
    const { config, music } = musicThatBelieves(false);

    insistOnBrowser(music);

    expect(config.isNodeEnvironment).toBe(false);
  });

  it("says nothing to a MusicKit that keeps its parts elsewhere", () => {
    expect(() => insistOnBrowser({} as MusicKit.MusicKitInstance)).not.toThrow();
  });
});
