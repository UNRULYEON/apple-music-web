import { describe, expect, it } from "vitest";
import { matchWorkflow } from "./match-workflow.ts";

const NAMES = ["cd.yml", "ci.yml"];

describe("matchWorkflow", () => {
  it("matches the full file name", () => {
    expect(matchWorkflow(NAMES, "ci.yml")).toBe("ci.yml");
  });

  it("matches without the extension", () => {
    expect(matchWorkflow(NAMES, "ci")).toBe("ci.yml");
  });

  it("matches a yaml extension too", () => {
    expect(matchWorkflow(["release.yaml"], "release")).toBe("release.yaml");
  });

  it("returns nothing for an unknown name", () => {
    expect(matchWorkflow(NAMES, "nope")).toBeUndefined();
  });
});
