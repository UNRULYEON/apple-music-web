// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from "vitest";
import { MIGRATION_SCRIPT, STORAGE_KEYS } from "@/lib/storage/keys";

function runMigrationScript(): void {
  new Function(MIGRATION_SCRIPT)();
}

afterEach(() => {
  localStorage.clear();
});

describe("MIGRATION_SCRIPT", () => {
  it("moves a value from its old key to its new key", () => {
    localStorage.setItem("theme", "dark");

    runMigrationScript();

    expect(localStorage.getItem(STORAGE_KEYS.theme)).toBe("dark");
    expect(localStorage.getItem("theme")).toBeNull();
  });

  it("keeps a value that the new key already holds", () => {
    localStorage.setItem("volume", "0.2");
    localStorage.setItem(STORAGE_KEYS.volume, "0.8");

    runMigrationScript();

    expect(localStorage.getItem(STORAGE_KEYS.volume)).toBe("0.8");
    expect(localStorage.getItem("volume")).toBeNull();
  });

  it("moves the devtools token from its old key", () => {
    localStorage.setItem("music-kit-devtools.saved-token", "saved");

    runMigrationScript();

    expect(localStorage.getItem(STORAGE_KEYS.devtoolsToken)).toBe("saved");
  });

  it("leaves storage alone when there is nothing to move", () => {
    runMigrationScript();

    expect(localStorage.length).toBe(0);
  });
});
