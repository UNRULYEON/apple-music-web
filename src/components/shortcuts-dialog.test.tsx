// @vitest-environment happy-dom
import { ShortcutsDialog } from "@/components/shortcuts-dialog";
import { SidebarProvider } from "@/contexts";
import { useSidebar } from "@/hooks";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function stubViewport({ mobile }: { mobile: boolean }) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: mobile ? query.includes("max-width") : query.includes("min-width"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }));
}

beforeEach(() => {
  stubViewport({ mobile: false });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});

function renderDialog() {
  const seen: { current?: ReturnType<typeof useSidebar> } = {};

  function Probe() {
    seen.current = useSidebar();
    return null;
  }

  render(
    <SidebarProvider>
      <Probe />
      <ShortcutsDialog />
    </SidebarProvider>,
  );

  return seen;
}

function openShortcuts() {
  fireEvent.click(screen.getByRole("button", { name: "Shortcuts" }));
}

describe("ShortcutsDialog", () => {
  it("keeps the shortcuts away until a person asks for them", () => {
    renderDialog();

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows every shortcut of the app", async () => {
    renderDialog();

    openShortcuts();

    const dialog = await screen.findByRole("dialog", { name: "Keyboard shortcuts" });

    for (const label of [
      "Open or close the sidebar",
      "Play or pause",
      "Next song",
      "Previous song",
      "Shuffle",
      "Repeat",
      "Volume up",
      "Volume down",
    ]) {
      expect(dialog.textContent).toContain(label);
    }
  });

  it("names Space with a word", async () => {
    renderDialog();

    openShortcuts();

    const dialog = await screen.findByRole("dialog");
    const keys = [...dialog.querySelectorAll('[data-slot="kbd"]')].map((key) => key.textContent);

    expect(keys).toContain("Space");
  });

  it("opens with the question mark", async () => {
    renderDialog();

    fireEvent.keyDown(document.body, { key: "?", code: "Slash", shiftKey: true });

    expect(await screen.findByRole("dialog", { name: "Keyboard shortcuts" })).toBeTruthy();
  });

  it("closes the sidebar when the question mark opens it on a narrow viewport", async () => {
    stubViewport({ mobile: true });
    const seen = renderDialog();

    act(() => seen.current?.setPeeking(true));

    fireEvent.keyDown(document.body, { key: "?", code: "Slash", shiftKey: true });

    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(seen.current?.isPeeking).toBe(false);
  });

  it("leaves the question mark to a person who types it", () => {
    renderDialog();

    const input = document.createElement("input");
    document.body.append(input);
    input.focus();

    fireEvent.keyDown(input, { key: "?", code: "Slash", shiftKey: true });
    input.remove();

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("leaves the sidebar open on a wide viewport", async () => {
    const seen = renderDialog();

    openShortcuts();
    await screen.findByRole("dialog");

    expect(seen.current?.isOpen).toBe(true);
  });

  it("closes the sidebar before it shows the shortcuts on a narrow viewport", async () => {
    stubViewport({ mobile: true });
    const seen = renderDialog();

    act(() => seen.current?.setPeeking(true));
    expect(seen.current?.isPeeking).toBe(true);

    openShortcuts();

    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(seen.current?.isPeeking).toBe(false);
  });
});
