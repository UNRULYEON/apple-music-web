import { describe, expect, it } from "vitest";
import { parseBranches } from "./parse-branches.ts";

describe("parseBranches", () => {
  it("drops the bare remote name that stands for the remote HEAD", () => {
    expect(parseBranches("origin\norigin/main\norigin/feat", true)).toEqual([
      "origin/feat",
      "origin/main",
    ]);
  });

  it("keeps plain local names and sorts them", () => {
    expect(parseBranches("main\nci/fix\n", false)).toEqual(["ci/fix", "main"]);
  });

  it("drops a symbolic ref written with an arrow", () => {
    expect(parseBranches("origin/HEAD -> origin/main\norigin/main", true)).toEqual(["origin/main"]);
  });

  it("returns nothing for empty output", () => {
    expect(parseBranches("", false)).toEqual([]);
  });
});
