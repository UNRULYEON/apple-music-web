import { describe, expect, it } from "vitest";
import { parseEvents } from "./parse-events";

describe("parseEvents", () => {
  it("reads a block of events and drops workflow_call", () => {
    const text = "name: CI\non:\n  pull_request:\n    types: [opened]\n  workflow_call:\n\njobs:\n";
    expect(parseEvents(text)).toEqual(["pull_request"]);
  });

  it("reads an inline list", () => {
    expect(parseEvents("on: [push, pull_request]\n")).toEqual(["push", "pull_request"]);
  });

  it("reads a single inline event", () => {
    expect(parseEvents("on: push\n")).toEqual(["push"]);
  });

  it("stops at the next top level key", () => {
    expect(parseEvents("on:\n  push:\njobs:\n  build:\n")).toEqual(["push"]);
  });

  it("keeps an event that carries a dash", () => {
    expect(parseEvents("on:\n  workflow_dispatch:\n  push:\n")).toEqual([
      "workflow_dispatch",
      "push",
    ]);
  });

  it("returns nothing when there is no trigger", () => {
    expect(parseEvents("name: CI\n")).toEqual([]);
  });
});
