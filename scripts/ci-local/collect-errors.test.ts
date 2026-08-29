import { describe, expect, it } from "vitest";
import { collectErrors } from "./collect-errors.ts";

describe("collectErrors", () => {
  it("keeps only the message after the annotation", () => {
    const lines = ["[CI/lint] ❗  ::error file=a.ts,line=1::Expected a function declaration."];
    expect(collectErrors(lines)).toEqual(["Expected a function declaration."]);
  });

  it("ignores lines without an annotation", () => {
    expect(collectErrors(["[CI/lint] all good"])).toEqual([]);
  });

  it("caps the list at five", () => {
    const lines = Array.from({ length: 9 }, (_, index) => `::error::problem ${index}`);
    expect(collectErrors(lines)).toHaveLength(5);
  });
});
