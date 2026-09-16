// @vitest-environment happy-dom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readStoredVolume, writeStoredVolume } from "@/lib/storage/volume";
import { fakeMusicKit, type FakeMusicKit, stubMusicKit } from "@/test/fake-music-kit";
import { PlayerVolume } from "./player-volume";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));

let music: FakeMusicKit;

beforeEach(() => {
  localStorage.clear();
  music = fakeMusicKit();
  stubMusicKit(music);
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

function trigger() {
  return screen.getByRole("button", { name: /^Volume,/ });
}

function slider() {
  return screen.queryByRole("slider", { name: "Volume level" });
}

async function openPopover() {
  fireEvent.click(trigger());

  await waitFor(() => expect(slider()).toBeTruthy());
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

  it("makes the tab louder and quieter with Shift and the arrows", async () => {
    music.volume = 0.5;

    render(<PlayerVolume />);
    await waitFor(() => expect(trigger().getAttribute("aria-label")).toBe("Volume, 50 percent"));

    fireEvent.keyDown(document.body, { key: "ArrowUp", shiftKey: true });
    await waitFor(() => expect(music.volume).toBe(0.6));

    fireEvent.keyDown(document.body, { key: "ArrowDown", shiftKey: true });
    fireEvent.keyDown(document.body, { key: "ArrowDown", shiftKey: true });
    await waitFor(() => expect(music.volume).toBe(0.4));
  });

  it("stops at the loudest level", async () => {
    music.volume = 0.95;

    render(<PlayerVolume />);
    await waitFor(() => expect(trigger().getAttribute("aria-label")).toBe("Volume, 95 percent"));

    fireEvent.keyDown(document.body, { key: "ArrowUp", shiftKey: true });

    await waitFor(() => expect(music.volume).toBe(1));
  });

  it("shows the new level above the speaker when a person uses the keys", async () => {
    music.volume = 0.5;

    render(<PlayerVolume />);
    await waitFor(() => expect(trigger().getAttribute("aria-label")).toBe("Volume, 50 percent"));

    fireEvent.keyDown(document.body, { key: "ArrowUp", shiftKey: true });

    const hint = await screen.findByRole("status");
    await waitFor(() => expect(hint.querySelector(".rn-value")?.textContent).toBe("60"));
  });

  it("lets the level go a moment after the last key", async () => {
    render(<PlayerVolume />);

    fireEvent.keyDown(document.body, { key: "ArrowDown", shiftKey: true });
    await screen.findByRole("status");

    await waitFor(() => expect(screen.queryByRole("status")).toBeNull(), { timeout: 2000 });
  });

  it("leaves the level to the slider while the slider is open", async () => {
    render(<PlayerVolume />);
    await openPopover();

    fireEvent.keyDown(slider()!, { key: "ArrowDown", shiftKey: true });

    await waitFor(() => expect(music.volume).toBe(0.9));
    expect(screen.queryByRole("status")).toBeNull();
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
