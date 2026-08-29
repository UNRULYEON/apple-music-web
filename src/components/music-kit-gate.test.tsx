// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MusicKitGate } from "@/components/music-kit-gate";
import { loadAuthorization, signIn } from "@/lib/music-kit/auth";

vi.mock("@/lib/music-kit/auth", () => ({ loadAuthorization: vi.fn(), signIn: vi.fn() }));

const load = vi.mocked(loadAuthorization);
const authorize = vi.mocked(signIn);

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
    signInCard: () => screen.queryByText("Sign in to Apple Music"),
    appIsBlocked: () => Boolean(view.container.querySelector(".isolate")?.hasAttribute("inert")),
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("MusicKitGate", () => {
  it("shows only a spinner while MusicKit starts", () => {
    load.mockReturnValue(new Promise(() => {}));

    const gate = renderGate();

    expect(gate.spinner()).not.toBeNull();
    expect(gate.signInCard()).toBeNull();
    expect(gate.appIsBlocked()).toBe(true);
  });

  it("swaps the spinner for the sign in dialog", async () => {
    load.mockResolvedValue(false);

    const gate = renderGate();

    expect(await screen.findByText("Sign in to Apple Music")).not.toBeNull();
    await waitFor(() => expect(gate.spinner()).toBeNull());
    expect(gate.appIsBlocked()).toBe(true);
  });

  it("swaps the spinner for the app when the visitor is already signed in", async () => {
    load.mockResolvedValue(true);

    const gate = renderGate();

    await waitFor(() => expect(gate.gate()).toBeNull());
    expect(gate.signInCard()).toBeNull();
    expect(gate.appIsBlocked()).toBe(false);
  });

  it("never shows the sign in dialog before the answer arrives", async () => {
    let answer!: (authorized: boolean) => void;
    load.mockReturnValue(
      new Promise<boolean>((resolve) => {
        answer = resolve;
      }),
    );

    const gate = renderGate();
    expect(gate.signInCard()).toBeNull();

    answer(false);

    expect(await screen.findByText("Sign in to Apple Music")).not.toBeNull();
  });

  it("takes the gate away after a successful sign in", async () => {
    load.mockResolvedValue(false);
    authorize.mockResolvedValue(true);

    const gate = renderGate();
    fireEvent.click(await screen.findByRole("button", { name: "Continue with Apple Music" }));

    await waitFor(() => expect(gate.gate()).toBeNull());
    expect(authorize).toHaveBeenCalledOnce();
    expect(gate.appIsBlocked()).toBe(false);
  });

  it("keeps the dialog and says why when sign in fails", async () => {
    load.mockResolvedValue(false);
    authorize.mockRejectedValue(new Error("The user closed the window."));

    const gate = renderGate();
    fireEvent.click(await screen.findByRole("button", { name: "Continue with Apple Music" }));

    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "The user closed the window.",
    );
    expect(gate.signInCard()).not.toBeNull();
    expect(gate.appIsBlocked()).toBe(true);
  });

  it("never signs a visitor in on its own", async () => {
    load.mockResolvedValue(false);

    renderGate();
    await screen.findByText("Sign in to Apple Music");

    expect(authorize).not.toHaveBeenCalled();
  });
});
