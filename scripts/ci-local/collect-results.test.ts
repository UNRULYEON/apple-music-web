import { describe, expect, it } from "vitest";
import { collectResults } from "./collect-results";

describe("collectResults", () => {
  it("reads a passing job", () => {
    expect(collectResults(["[CI/install deps] 🏁  Job succeeded"])).toEqual([
      { name: "install deps", passed: true, step: undefined },
    ]);
  });

  it("strips the matrix suffix from the job name", () => {
    expect(collectResults(["[CI/lint-3       ] 🏁  Job succeeded"])[0].name).toBe("lint");
  });

  it("reads dry run output, which carries a prefix", () => {
    expect(collectResults(["*DRYRUN* [CI/build-1] 🏁  Job succeeded"])[0].name).toBe("build");
  });

  it("keeps the step that failed", () => {
    const lines = ["[CI/lint] ❌  Failure - Main Run lint [47.4ms]", "[CI/lint] 🏁  Job failed"];
    expect(collectResults(lines)).toEqual([{ name: "lint", passed: false, step: "Run lint" }]);
  });

  it("does not attach a step to a job that passed", () => {
    const lines = ["[CI/lint] ❌  Failure - Main Run lint [4ms]", "[CI/lint] 🏁  Job succeeded"];
    expect(collectResults(lines)[0].step).toBeUndefined();
  });

  it("keeps one entry per job", () => {
    const lines = ["[CI/lint] 🏁  Job failed", "[CI/lint] 🏁  Job succeeded"];
    expect(collectResults(lines)).toHaveLength(1);
  });

  it("ignores lines that carry no job label", () => {
    expect(collectResults(["time=... level=info msg=hello"])).toEqual([]);
  });
});
