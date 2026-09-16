import { describe, expect, it } from "vitest";
import { stripAnsi } from "./strip-ansi.ts";

const ESC = String.fromCharCode(27);

describe("stripAnsi", () => {
  it("removes colour codes", () => {
    expect(stripAnsi(`${ESC}[32mgreen${ESC}[0m`)).toBe("green");
  });

  it("removes cursor movement", () => {
    expect(stripAnsi(`${ESC}[2A${ESC}[0Jgone`)).toBe("gone");
  });

  it("leaves plain text alone", () => {
    expect(stripAnsi("plain")).toBe("plain");
  });
});
