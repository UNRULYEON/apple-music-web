import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hasDrm, MissingDrmError } from "@/lib/music-kit/drm";
import {
  fakeMusicKit,
  type FakeMusicKit,
  REPEAT_MODES,
  SHUFFLE_MODES,
  stubMusicKitGlobals,
} from "@/lib/music-kit/fake-music-kit";
import { getMusicKit } from "@/lib/music-kit/instance";
import {
  changeToIndex,
  clearPlayback,
  describeError,
  pausePlayback,
  playSongs,
  playStation,
  queueLast,
  queueNext,
  resumePlayback,
  setRepeatMode,
  setShuffleMode,
  silenceKnownRejections,
  subscribeToPlaybackErrors,
} from "@/lib/music-kit/playback";
import type { Song } from "@/lib/music-kit/track";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));
vi.mock("@/lib/music-kit/drm", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/music-kit/drm")>()),
  hasDrm: vi.fn(async () => true),
}));
vi.mock("@/lib/music-kit/storefront", () => ({
  fetchStorefront: vi.fn().mockResolvedValue({ id: "nl", name: "Netherlands" }),
}));

let music: FakeMusicKit;

beforeEach(() => {
  stubMusicKitGlobals();
  music = fakeMusicKit();
  vi.mocked(getMusicKit).mockResolvedValue(music as unknown as MusicKit.MusicKitInstance);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const SONGS: Song[] = [
  { id: "i.one", name: "One", playId: "111" },
  { id: "i.two", name: "Two", playId: "222" },
];

describe("playSongs", () => {
  it("gives the whole list to MusicKit and starts at the chosen song", async () => {
    await playSongs(SONGS, { startAt: 1 });

    expect(music.setQueue).toHaveBeenCalledWith({
      songs: ["111", "222"],
      startWith: 1,
      startPlaying: true,
      shuffleMode: SHUFFLE_MODES.off,
    });
  });

  it("asks MusicKit to shuffle rather than shuffling itself", async () => {
    await playSongs(SONGS, { shuffle: true });

    expect(music.setQueue).toHaveBeenCalledWith(
      expect.objectContaining({ shuffleMode: SHUFFLE_MODES.songs }),
    );
  });

  it("starts a shuffle at a song picked at random", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.75);

    await playSongs(SONGS, { shuffle: true });

    expect(music.setQueue).toHaveBeenCalledWith(expect.objectContaining({ startWith: 1 }));
  });

  it("starts a shuffle at the song a person points at", async () => {
    await playSongs(SONGS, { shuffle: true, startAt: 0 });

    expect(music.setQueue).toHaveBeenCalledWith(expect.objectContaining({ startWith: 0 }));
  });

  it("falls back to the id of a song that has no catalog id", async () => {
    await playSongs([{ id: "i.only", name: "Only" }]);

    expect(music.setQueue).toHaveBeenCalledWith(expect.objectContaining({ songs: ["i.only"] }));
  });

  it("plays the songs that are left when Apple refuses one of them", async () => {
    const three = [...SONGS, { id: "i.three", name: "Three", playId: "333" }];

    music.setQueue.mockRejectedValueOnce(new Error("One or more items could not be resolved: 222"));

    await playSongs(three, { startAt: 2 });

    expect(music.setQueue).toHaveBeenLastCalledWith(
      expect.objectContaining({ songs: ["111", "333"], startWith: 1 }),
    );
  });

  it("drops every song Apple names at once", async () => {
    const three = [...SONGS, { id: "i.three", name: "Three", playId: "333" }];

    music.setQueue.mockRejectedValueOnce(
      new Error("One or more items could not be resolved: 111, 222"),
    );

    await playSongs(three, { startAt: 2 });

    expect(music.setQueue).toHaveBeenLastCalledWith(
      expect.objectContaining({ songs: ["333"], startWith: 0 }),
    );
  });

  it("tells a person plainly when Apple refuses the song they picked", async () => {
    music.setQueue.mockRejectedValueOnce(new Error("One or more items could not be resolved: 222"));

    await expect(playSongs(SONGS, { startAt: 1 })).rejects.toThrow(
      "Apple Music does not have that song here.",
    );
  });

  it("keeps the complaint of Apple when it names no song at all", async () => {
    music.setQueue.mockRejectedValueOnce(new Error("The network stopped."));

    await expect(playSongs(SONGS)).rejects.toThrow("The network stopped.");
    expect(music.setQueue).toHaveBeenCalledTimes(1);
  });

  it("keeps the complaint of Apple when it refuses every song", async () => {
    music.setQueue.mockRejectedValueOnce(
      new Error("One or more items could not be resolved: 111, 222"),
    );

    await expect(playSongs(SONGS)).rejects.toThrow("could not be resolved");
  });

  it("says nothing to MusicKit about an empty list", async () => {
    await playSongs([]);

    expect(music.setQueue).not.toHaveBeenCalled();
  });

  it("complains, with what the catalog says, when MusicKit keeps no song", async () => {
    music.queueIsEmpty = true;
    music.api.music.mockResolvedValue({
      data: { data: [{ id: "111", attributes: { name: "One", playParams: {} } }] },
    });

    await expect(playSongs(SONGS)).rejects.toThrow('The nl catalog holds it as "One"');
  });
});

describe("playStation", () => {
  it("hands MusicKit the station and lets it fill the queue", async () => {
    await playStation("ra.978194965");

    expect(music.setQueue).toHaveBeenCalledWith({
      station: "ra.978194965",
      startPlaying: true,
    });
  });

  it("complains when MusicKit keeps no song for the station", async () => {
    music.queueIsEmpty = true;

    await expect(playStation("ra.978194965")).rejects.toThrow("ra.978194965");
  });
});

describe("the queue", () => {
  it("puts songs after the one that plays now", async () => {
    await queueNext(SONGS);

    expect(music.playNext).toHaveBeenCalledWith({ songs: ["111", "222"] });
  });

  it("puts songs at the end", async () => {
    await queueLast(SONGS);

    expect(music.playLater).toHaveBeenCalledWith({ songs: ["111", "222"] });
  });
});

describe("the controls", () => {
  it("hands every action to MusicKit", async () => {
    await resumePlayback();
    await pausePlayback();
    await changeToIndex(4);

    expect(music.play).toHaveBeenCalledOnce();
    expect(music.pause).toHaveBeenCalledOnce();
    expect(music.changeToMediaAtIndex).toHaveBeenCalledWith(4);
  });

  it("sets the shuffle mode on MusicKit", async () => {
    await setShuffleMode(true);
    expect(music.shuffleMode).toBe(SHUFFLE_MODES.songs);

    await setShuffleMode(false);
    expect(music.shuffleMode).toBe(SHUFFLE_MODES.off);
  });

  it("sets the repeat mode on MusicKit", async () => {
    await setRepeatMode("song");
    expect(music.repeatMode).toBe(REPEAT_MODES.one);

    await setRepeatMode("queue");
    expect(music.repeatMode).toBe(REPEAT_MODES.all);

    await setRepeatMode("off");
    expect(music.repeatMode).toBe(REPEAT_MODES.none);
  });
});

describe("describeError", () => {
  it("says in words what Apple Music calls the error", () => {
    expect(describeError({ name: "SUBSCRIPTION_ERROR" })).toBe(
      "This Apple Music account has no subscription that plays songs. (SUBSCRIPTION_ERROR)",
    );
  });

  it("gives back the message when the name is not one it knows", () => {
    expect(describeError({ name: "SOMETHING_NEW", message: "It broke." })).toBe("It broke.");
  });
});

describe("subscribeToPlaybackErrors", () => {
  it("passes on what MusicKit says went wrong", async () => {
    const onError = vi.fn();
    const onSessionBroken = vi.fn();
    const stop = await subscribeToPlaybackErrors({ onError, onSessionBroken });

    music.emit("mediaPlaybackError", { error: { name: "CONTENT_UNAVAILABLE" } });

    expect(onError).toHaveBeenCalledWith(
      "Apple Music does not have that song here. (CONTENT_UNAVAILABLE)",
    );

    stop();
    music.emit("mediaPlaybackError", { error: { name: "CONTENT_UNAVAILABLE" } });

    expect(onError).toHaveBeenCalledOnce();
  });

  it.each(["MEDIA_KEY", "MEDIA_SESSION", "MEDIA_LICENSE"])(
    "asks for the queue to be built again after a %s error, without a word to a person",
    async (name) => {
      const onError = vi.fn();
      const onSessionBroken = vi.fn();

      await subscribeToPlaybackErrors({ onError, onSessionBroken });
      music.emit("playbackSessionError", { error: { name } });

      expect(onSessionBroken).toHaveBeenCalledOnce();
      expect(onError).not.toHaveBeenCalled();
    },
  );
});

describe("resumePlayback", () => {
  it("says nothing to MusicKit when it plays already", async () => {
    music.isPlaying = true;

    await resumePlayback();

    expect(music.play).not.toHaveBeenCalled();
  });
});

describe("silenceKnownRejections", () => {
  function reject(message: string): boolean {
    let prevented = false;
    const event = {
      reason: new Error(message),
      preventDefault: () => {
        prevented = true;
      },
    };

    for (const listener of handlers) {
      listener(event as unknown as PromiseRejectionEvent);
    }

    return prevented;
  }

  let handlers: ((event: PromiseRejectionEvent) => void)[] = [];

  beforeEach(() => {
    handlers = [];
    vi.stubGlobal("addEventListener", (_name: string, listener: unknown) => {
      handlers.push(listener as (event: PromiseRejectionEvent) => void);
    });
    vi.stubGlobal("removeEventListener", () => {});
  });

  it("keeps the complaint of MusicKit about a second play out of the console", () => {
    silenceKnownRejections();

    expect(reject("The play() method was called without a previous stop() or pause() call.")).toBe(
      true,
    );
  });

  it("lets every other complaint through", () => {
    silenceKnownRejections();

    expect(reject("Something else broke")).toBe(false);
  });
});

describe("a browser without DRM", () => {
  beforeEach(() => {
    vi.mocked(hasDrm).mockResolvedValue(false);
  });

  it("plays nothing, so Apple Music cannot fall back to a preview", async () => {
    await expect(playSongs(SONGS)).rejects.toBeInstanceOf(MissingDrmError);

    expect(music.setQueue).not.toHaveBeenCalled();
  });

  it("does not start a song that is already loaded", async () => {
    await expect(resumePlayback()).rejects.toBeInstanceOf(MissingDrmError);

    expect(music.play).not.toHaveBeenCalled();
  });

  it("starts no station either", async () => {
    await expect(playStation("ra.1")).rejects.toBeInstanceOf(MissingDrmError);

    expect(music.setQueue).not.toHaveBeenCalled();
  });

  it("takes nothing into the queue either", async () => {
    await expect(queueNext(SONGS)).rejects.toBeInstanceOf(MissingDrmError);
    await expect(queueLast(SONGS)).rejects.toBeInstanceOf(MissingDrmError);

    expect(music.playNext).not.toHaveBeenCalled();
    expect(music.playLater).not.toHaveBeenCalled();
  });

  it("says what is wrong and what a person can do", async () => {
    await expect(playSongs(SONGS)).rejects.toThrow(/DRM/);
  });
});

describe("clearPlayback", () => {
  it("stops the sound, lets the queue go, and puts shuffle and repeat back", async () => {
    music.shuffleMode = SHUFFLE_MODES.songs;
    music.repeatMode = REPEAT_MODES.all;

    await clearPlayback();

    expect(music.stop).toHaveBeenCalledOnce();
    expect(music.clearQueue).toHaveBeenCalledOnce();
    expect(music.shuffleMode).toBe(SHUFFLE_MODES.off);
    expect(music.repeatMode).toBe(REPEAT_MODES.none);
  });
});
