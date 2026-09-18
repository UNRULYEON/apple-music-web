// @vitest-environment happy-dom

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireConfetti } from "@/lib/confetti";
import { setAuthStatus } from "@/lib/music-kit/auth";
import { dropToken, restoreToken } from "@/lib/music-kit/dev-session";
import { getMusicKit } from "@/lib/music-kit/instance";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import { stubMusicKit } from "@/test/fake-music-kit";
import { MusicKitGate } from "./music-kit-gate";

vi.mock("@/lib/music-kit/instance", () => ({ getMusicKit: vi.fn() }));
vi.mock("@/lib/confetti", () => ({ fireConfetti: vi.fn() }));
vi.mock("@/hooks/use-reset-when-signed-out", () => ({ useResetWhenSignedOut: vi.fn() }));
vi.mock("@/hooks/use-persisted-cache", () => ({ usePersistedCache: vi.fn() }));
vi.mock("@/hooks/use-prefetch-library", () => ({ usePrefetchLibrary: vi.fn() }));
vi.mock("@/hooks/use-demo-mode-hotkey", () => ({ useDemoModeHotkey: vi.fn() }));

const confetti = vi.mocked(fireConfetti);

function mockMusic(token = "") {
  let current = token;

  const music = {
    isAuthorized: Boolean(token),
    get musicUserToken(): string {
      return current;
    },
    set musicUserToken(next: string) {
      current = next;
      music.isAuthorized = Boolean(next);
    },
    authorize: vi.fn(async () => {
      music.musicUserToken = "music-user-token";
      return music.musicUserToken;
    }),
  };

  stubMusicKit(music);

  return music;
}

function renderGate() {
  const view = render(
    <MusicKitGate>
      <button type="button">Play</button>
    </MusicKitGate>,
  );

  return {
    ...view,
    gate: () => screen.queryByRole("dialog"),
    spinner: () => screen.queryByRole("status"),
    signInCard: () => screen.queryByText("Sign in with Apple Music"),
    appIsBlocked: () => Boolean(view.container.firstElementChild?.hasAttribute("inert")),
  };
}

beforeEach(() => {
  setAuthStatus("checking");
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

describe("MusicKitGate", () => {
  it("shows only a spinner while MusicKit starts", () => {
    vi.mocked(getMusicKit).mockReturnValue(new Promise(() => {}));

    const gate = renderGate();

    expect(gate.spinner()).toBeTruthy();
    expect(gate.signInCard()).toBeNull();
    expect(gate.appIsBlocked()).toBe(true);
  });

  it("swaps the spinner for the sign in dialog", async () => {
    mockMusic();

    const gate = renderGate();

    expect(await screen.findByText("Sign in with Apple Music")).toBeTruthy();
    await waitFor(() => expect(gate.spinner()).toBeNull());
    expect(gate.appIsBlocked()).toBe(true);
  });

  it("swaps the spinner for the app when the visitor is already signed in", async () => {
    mockMusic("a-music-user-token");

    const gate = renderGate();

    await waitFor(() => expect(gate.gate()).toBeNull());
    expect(gate.signInCard()).toBeNull();
    expect(gate.appIsBlocked()).toBe(false);
  });

  it("never shows the sign in dialog before the answer arrives", async () => {
    let answer!: (music: MusicKit.MusicKitInstance) => void;
    vi.mocked(getMusicKit).mockReturnValue(
      new Promise<MusicKit.MusicKitInstance>((resolve) => {
        answer = resolve;
      }),
    );

    const gate = renderGate();
    expect(gate.signInCard()).toBeNull();

    answer({ isAuthorized: false } as MusicKit.MusicKitInstance);

    expect(await screen.findByText("Sign in with Apple Music")).toBeTruthy();
  });

  it("takes the gate away after a successful sign in", async () => {
    const music = mockMusic();

    const gate = renderGate();
    fireEvent.click(await screen.findByRole("button", { name: "Continue with Apple Music" }));

    await waitFor(() => expect(gate.gate()).toBeNull());
    expect(music.authorize).toHaveBeenCalledOnce();
    expect(gate.appIsBlocked()).toBe(false);
  });

  it("shows confetti after a successful sign in", async () => {
    mockMusic();

    renderGate();
    fireEvent.click(await screen.findByRole("button", { name: "Continue with Apple Music" }));

    await waitFor(() => expect(confetti).toHaveBeenCalledOnce());
  });

  it("shows no confetti for a visitor who is already signed in", async () => {
    mockMusic("a-music-user-token");

    const gate = renderGate();

    await waitFor(() => expect(gate.gate()).toBeNull());
    expect(confetti).not.toHaveBeenCalled();
  });

  it("shows no confetti when sign in fails", async () => {
    const music = mockMusic();
    music.authorize.mockRejectedValue(new Error("The user closed the window."));

    renderGate();
    fireEvent.click(await screen.findByRole("button", { name: "Continue with Apple Music" }));

    await screen.findByRole("alert");
    expect(confetti).not.toHaveBeenCalled();
  });

  it("keeps the dialog and says why when sign in fails", async () => {
    const music = mockMusic();
    music.authorize.mockRejectedValue(new Error("The user closed the window."));

    const gate = renderGate();
    fireEvent.click(await screen.findByRole("button", { name: "Continue with Apple Music" }));

    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "The user closed the window.",
    );
    expect(gate.signInCard()).toBeTruthy();
    expect(gate.appIsBlocked()).toBe(true);
  });

  it("never signs a visitor in on its own", async () => {
    const music = mockMusic();

    renderGate();
    await screen.findByText("Sign in with Apple Music");

    expect(music.authorize).not.toHaveBeenCalled();
  });

  it("comes back when the devtools drop the token, with no page reload", async () => {
    mockMusic("a-music-user-token");

    const gate = renderGate();
    await waitFor(() => expect(gate.gate()).toBeNull());

    await act(async () => {
      await dropToken();
    });

    expect(await screen.findByText("Sign in with Apple Music")).toBeTruthy();
    expect(gate.appIsBlocked()).toBe(true);
  });

  it("goes away when the devtools give the token back", async () => {
    const music = mockMusic("a-music-user-token");
    localStorage.setItem(
      STORAGE_KEYS.devtoolsToken,
      JSON.stringify({ savedAt: new Date().toISOString(), token: "a-music-user-token" }),
    );

    const gate = renderGate();
    await waitFor(() => expect(gate.gate()).toBeNull());

    await act(async () => {
      await dropToken();
    });
    await screen.findByText("Sign in with Apple Music");

    await act(async () => {
      await restoreToken();
    });

    await waitFor(() => expect(gate.gate()).toBeNull());
    expect(music.authorize).not.toHaveBeenCalled();
  });
});
