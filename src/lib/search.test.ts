import { matchesSearch } from "@/lib/search";
import { describe, expect, it } from "vitest";

describe("matchesSearch", () => {
  it("takes everything while a person has typed nothing", () => {
    expect(matchesSearch("", "The record")).toBe(true);
    expect(matchesSearch("   ", "The record")).toBe(true);
  });

  it("looks anywhere in the text, not only at its start", () => {
    expect(matchesSearch("record", "The record")).toBe(true);
  });

  it("pays no attention to case", () => {
    expect(matchesSearch("BOYGENIUS", "boygenius")).toBe(true);
  });

  it("pays no attention to accent marks", () => {
    expect(matchesSearch("bjork", "Björk")).toBe(true);
    expect(matchesSearch("Björk", "bjork")).toBe(true);
  });

  it("takes a row when any one of its fields matches", () => {
    expect(matchesSearch("boygenius", "The record", "boygenius")).toBe(true);
  });

  it("passes over a field that is not there", () => {
    expect(matchesSearch("boygenius", "The record", undefined)).toBe(false);
  });

  it("turns down a row that matches nothing", () => {
    expect(matchesSearch("nirvana", "The record", "boygenius")).toBe(false);
  });
});
