// @vitest-environment happy-dom
import { usePlaybackTime } from "@/hooks/use-playback-time";
import { seekTo } from "@/lib/music-kit/playback";
import {
  holdPlaybackTime,
  readHeldPlaybackTime,
  readPlaybackTime,
  resetPlaybackTime,
} from "@/lib/music-kit/playback-time";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/music-kit/playback", () => ({ seekTo: vi.fn().mockResolvedValue(undefined) }));

beforeEach(() => {
  resetPlaybackTime();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("seek", () => {
  it("moves the held place, so the bar stays where a person put the thumb", () => {
    holdPlaybackTime(42);

    const { result } = renderHook(() => usePlaybackTime());

    act(() => result.current.seek(90));

    expect(readHeldPlaybackTime()).toBe(90);
    expect(readPlaybackTime().position).toBe(90);
    expect(seekTo).toHaveBeenCalledWith(90);
  });

  it("holds nothing back for a song that is already open", () => {
    const { result } = renderHook(() => usePlaybackTime());

    act(() => result.current.seek(90));

    expect(readHeldPlaybackTime()).toBeUndefined();
    expect(seekTo).toHaveBeenCalledWith(90);
  });
});
