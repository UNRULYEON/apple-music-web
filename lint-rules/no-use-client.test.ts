import { RuleTester } from "oxlint/plugins-dev";
import { describe, it } from "vitest";
import { noUseClient } from "./no-use-client.ts";

RuleTester.describe = describe;
RuleTester.it = it;

new RuleTester().run("no-use-client", noUseClient, {
  valid: ["const a = 1;"],
  invalid: [
    {
      code: '"use client";\nconst a = 1;',
      output: "\nconst a = 1;",
      errors: [{ messageId: "directive" }],
    },
  ],
});
