import { RuleTester } from "oxlint/plugins-dev";
import { describe, it } from "vitest";
import { noComments } from "./no-comments.ts";

RuleTester.describe = describe;
RuleTester.it = it;

new RuleTester().run("no-comments", noComments, {
  valid: [
    "const a = 1;",
    "#!/usr/bin/env bun\nconst a = 1;",
    "// @vitest-environment happy-dom\nconst a = 1;",
    'const url = "https://example.com";',
  ],
  invalid: [
    { code: "// a note\nconst a = 1;", errors: [{ messageId: "comment" }] },
    { code: "const a = 1; /* a note */", errors: [{ messageId: "comment" }] },
  ],
});
