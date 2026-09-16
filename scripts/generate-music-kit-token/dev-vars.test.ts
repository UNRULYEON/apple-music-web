import { describe, expect, it } from "vitest";
import { hasToken, mergeDevVars } from "./dev-vars";

describe("mergeDevVars", () => {
  it("writes the only line into an empty file", () => {
    expect(mergeDevVars("", "abc")).toBe('MUSICKIT_DEVELOPER_TOKEN="abc"\n');
  });

  it("keeps the other variables", () => {
    const existing = 'OTHER="1"\nMUSICKIT_DEVELOPER_TOKEN="old"\nTHIRD="3"\n';

    expect(mergeDevVars(existing, "new")).toBe(
      'OTHER="1"\nMUSICKIT_DEVELOPER_TOKEN="new"\nTHIRD="3"\n',
    );
  });

  it("appends when the file holds no token", () => {
    expect(mergeDevVars('OTHER="1"\n', "abc")).toBe('OTHER="1"\nMUSICKIT_DEVELOPER_TOKEN="abc"\n');
  });

  it("does not grow the blank lines at the end", () => {
    expect(mergeDevVars('OTHER="1"\n\n\n', "abc")).toBe(
      'OTHER="1"\nMUSICKIT_DEVELOPER_TOKEN="abc"\n',
    );
  });

  it("leaves a variable with a longer name alone", () => {
    const existing = 'MUSICKIT_DEVELOPER_TOKEN_OLD="keep"\n';

    expect(mergeDevVars(existing, "abc")).toBe(
      'MUSICKIT_DEVELOPER_TOKEN_OLD="keep"\nMUSICKIT_DEVELOPER_TOKEN="abc"\n',
    );
  });
});

describe("hasToken", () => {
  it("finds an existing token", () => {
    expect(hasToken('OTHER="1"\nMUSICKIT_DEVELOPER_TOKEN="old"\n')).toBe(true);
  });

  it("reports nothing for an empty file", () => {
    expect(hasToken("")).toBe(false);
  });

  it("does not match a longer name", () => {
    expect(hasToken('MUSICKIT_DEVELOPER_TOKEN_OLD="x"\n')).toBe(false);
  });
});
