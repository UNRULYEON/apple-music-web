import { describe, expect, it } from "vitest";
import { isWorkflowFile } from "./is-workflow-file";

describe("isWorkflowFile", () => {
  it("accepts both yaml extensions", () => {
    expect(isWorkflowFile("ci.yml")).toBe(true);
    expect(isWorkflowFile("ci.yaml")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isWorkflowFile("README.md")).toBe(false);
  });
});
