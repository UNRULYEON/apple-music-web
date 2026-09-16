import { describe, expect, it, vi } from "vitest";
import { createListeners } from "@/lib/listeners";

describe("createListeners", () => {
  it("tells every listener", () => {
    const listeners = createListeners();
    const first = vi.fn();
    const second = vi.fn();

    listeners.subscribe(first);
    listeners.subscribe(second);
    listeners.notify();

    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });

  it("stops telling a listener that unsubscribed", () => {
    const listeners = createListeners();
    const listener = vi.fn();

    const unsubscribe = listeners.subscribe(listener);
    unsubscribe();
    listeners.notify();

    expect(listener).not.toHaveBeenCalled();
  });

  it("forgets every listener when cleared", () => {
    const listeners = createListeners();
    const listener = vi.fn();

    listeners.subscribe(listener);
    listeners.clear();
    listeners.notify();

    expect(listener).not.toHaveBeenCalled();
  });
});
