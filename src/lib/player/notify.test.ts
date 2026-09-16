import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Song } from "@/lib/music-kit/track";
// @vitest-environment happy-dom
import { askToNotify, canNotify, notifySong } from "@/lib/player/notify";

const SONG: Song = {
  id: "111",
  name: "Not Strong Enough",
  artist: { name: "boygenius" },
  artwork: { url: "https://example.test/{w}x{h}.jpg", width: 1200, height: 1200 },
};

const shown = vi.fn();
let permission: NotificationPermission;
let ask: ReturnType<typeof vi.fn>;

function stubNotification() {
  permission = "granted";
  ask = vi.fn(async () => permission);

  class FakeNotification extends EventTarget {
    constructor(title: string, options?: NotificationOptions) {
      super();
      shown(title, options, this);
    }

    close() {}

    static get permission() {
      return permission;
    }

    static requestPermission = ask;
  }

  vi.stubGlobal("Notification", FakeNotification);
}

function hideTab(hidden: boolean) {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => (hidden ? "hidden" : "visible"),
  });
}

beforeEach(() => {
  stubNotification();
  hideTab(true);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("canNotify", () => {
  it("knows when the browser has no notifications at all", () => {
    vi.stubGlobal("Notification", undefined);

    expect(canNotify()).toBe(false);
  });

  it("knows when the browser has them", () => {
    expect(canNotify()).toBe(true);
  });
});

describe("askToNotify", () => {
  it("asks the person only while nobody has answered yet", async () => {
    permission = "default";

    await expect(askToNotify()).resolves.toBe(false);
    expect(ask).toHaveBeenCalledOnce();
  });

  it("asks nothing again once a person has said yes", async () => {
    await expect(askToNotify()).resolves.toBe(true);
    expect(ask).not.toHaveBeenCalled();
  });

  it("asks nothing again once a person has said no", async () => {
    permission = "denied";

    await expect(askToNotify()).resolves.toBe(false);
    expect(ask).not.toHaveBeenCalled();
  });

  it("says no when the browser has no notifications", async () => {
    vi.stubGlobal("Notification", undefined);

    await expect(askToNotify()).resolves.toBe(false);
  });
});

describe("notifySong", () => {
  it("names the song and who made it", () => {
    notifySong(SONG);

    expect(shown).toHaveBeenCalledWith(
      "Not Strong Enough",
      expect.objectContaining({ body: "boygenius", silent: true, tag: "now-playing" }),
      expect.anything(),
    );
  });

  it("shows the artwork of the song, small and large", () => {
    notifySong(SONG);

    expect(shown.mock.lastCall?.[1]).toMatchObject({
      icon: "https://example.test/128x128.jpg",
      image: "https://example.test/512x512.jpg",
    });
  });

  it("leaves the artwork out when the song carries none", () => {
    notifySong({ id: "1", name: "Only" });

    expect(shown.mock.lastCall?.[1]).toMatchObject({ icon: undefined, image: undefined });
  });

  it("brings the app to the front when a person clicks it", () => {
    const focus = vi.fn();
    const close = vi.fn();

    vi.stubGlobal("focus", focus);
    notifySong(SONG);

    const notice = shown.mock.lastCall?.[2] as EventTarget & { close: () => void };

    notice.close = close;
    notice.dispatchEvent(new Event("click"));

    expect(focus).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
  });

  it("keeps quiet while the person is looking at the app", () => {
    hideTab(false);

    notifySong(SONG);

    expect(shown).not.toHaveBeenCalled();
  });

  it("keeps quiet while nobody has said yes", () => {
    permission = "default";

    notifySong(SONG);

    expect(shown).not.toHaveBeenCalled();
  });

  it("holds its peace when the browser turns the notification down", () => {
    vi.stubGlobal(
      "Notification",
      class {
        static permission = "granted";
        constructor() {
          throw new TypeError("Illegal constructor.");
        }
      },
    );

    expect(() => notifySong(SONG)).not.toThrow();
  });
});
