// @vitest-environment happy-dom
import { PlayerVolume } from "@/components/player-volume";
import { fakeMusicKit, type FakeMusicKit } from "@/lib/music-kit/fake-music-kit";
import { getMusicKit } from "@/lib/music-kit/instance";
import { readStoredVolume, writeStoredVolume } from "@/lib/volume-storage";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));

let music: FakeMusicKit;

beforeEach(() => {
  localStorage.clear();
  music = fakeMusicKit();
  vi.mocked(getMusicKit).mockResolvedValue(music as unknown as MusicKit.MusicKitInstance);
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

function trigger() {
  return screen.getByRole("button", { name: /^Volume,/ });
}

// the thumb keeps itself out of sight until it has measured the track, so the label
// finds it where a role query cannot
function slider() {
  return screen.queryByLabelText("Volume level");
}

async function openPopover() {
  fireEvent.click(trigger());

  await waitFor(() => expect(slider()).not.toBeNull());
}

describe("PlayerVolume", () => {
  it("shows how loud this tab plays", async () => {
    music.volume = 0.4;

    render(<PlayerVolume />);

    await waitFor(() => expect(trigger().getAttribute("aria-label")).toBe("Volume, 40 percent"));
  });

  it("keeps the slider away until a person asks for it", () => {
    render(<PlayerVolume />);

    expect(slider()).toBeNull();
  });

  it("opens the slider on the speaker", async () => {
    render(<PlayerVolume />);

    await openPopover();

    expect(slider()?.getAttribute("aria-valuenow")).toBe("1");
  });

  it("makes the tab quieter", async () => {
    render(<PlayerVolume />);
    await openPopover();

    const thumb = slider();
    if (!thumb) {
      throw new Error("The slider is not there.");
    }

    fireEvent.keyDown(thumb, { key: "ArrowDown" });

    await waitFor(() => expect(music.volume).toBeCloseTo(0.99));
  });

  it("takes the level a person left behind, and puts it on the player", async () => {
    music.volume = 1;
    writeStoredVolume(0.3);

    render(<PlayerVolume />);

    await waitFor(() => expect(trigger().getAttribute("aria-label")).toBe("Volume, 30 percent"));
    expect(music.volume).toBe(0.3);
  });

  it("keeps a new level for the next time", async () => {
    render(<PlayerVolume />);
    await openPopover();

    const thumb = slider();
    if (!thumb) {
      throw new Error("The slider is not there.");
    }

    fireEvent.keyDown(thumb, { key: "ArrowDown" });

    await waitFor(() => expect(readStoredVolume()).toBeCloseTo(0.99));
  });

  it("closes when a person presses outside it", async () => {
    render(<PlayerVolume />);
    await openPopover();

    fireEvent.pointerDown(document.body);
    fireEvent.mouseDown(document.body);
    fireEvent.click(document.body);

    await waitFor(() => expect(slider()).toBeNull());
  });
});
