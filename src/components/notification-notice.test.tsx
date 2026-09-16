// @vitest-environment happy-dom

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setAuthStatus } from "@/lib/music-kit/auth";
import { askToNotify, canNotify, isNotifyAnswered } from "@/lib/player/notify";
import { NotificationNotice } from "./notification-notice";

vi.mock("@/lib/player/notify", () => ({
  askToNotify: vi.fn().mockResolvedValue(true),
  canNotify: vi.fn(() => true),
  isNotifyAnswered: vi.fn(() => false),
}));

const TITLE = "Song notifications";

beforeEach(() => {
  vi.mocked(canNotify).mockReturnValue(true);
  vi.mocked(isNotifyAnswered).mockReturnValue(false);
  vi.mocked(askToNotify).mockResolvedValue(true);
  act(() => setAuthStatus("signed-in"));
});

afterEach(() => {
  cleanup();
  act(() => setAuthStatus("checking"));
  localStorage.clear();
  vi.clearAllMocks();
});

function show() {
  render(<NotificationNotice />);
}

async function findNotice() {
  return screen.findByRole("dialog", { name: TITLE });
}

describe("NotificationNotice", () => {
  it("explains itself when the page opens", async () => {
    show();

    expect(await findNotice()).toBeTruthy();
    expect(screen.getByText(/Your browser asks you next/)).toBeTruthy();
  });

  it("asks the browser only after a person says to go on", async () => {
    show();
    await findNotice();

    expect(askToNotify).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(askToNotify).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("asks the browser nothing when a person says not now", async () => {
    show();
    await findNotice();

    fireEvent.click(screen.getByRole("button", { name: "Not now" }));

    expect(askToNotify).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("explains itself once and never again", async () => {
    show();
    await findNotice();
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    cleanup();

    show();

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("stays away while nobody is signed in", async () => {
    act(() => setAuthStatus("signed-out"));

    show();

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("stays away when the browser knows no notifications", async () => {
    vi.mocked(canNotify).mockReturnValue(false);

    show();

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("stays away when a person has already answered the browser", async () => {
    vi.mocked(isNotifyAnswered).mockReturnValue(true);

    show();

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("comes back when a person pushed it away without answering", async () => {
    show();
    const notice = await findNotice();

    fireEvent.keyDown(notice, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    cleanup();

    show();

    expect(await screen.findByRole("dialog")).toBeTruthy();
  });
});
