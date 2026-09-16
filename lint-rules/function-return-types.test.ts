import { RuleTester } from "oxlint/plugins-dev";
import { describe, it } from "vitest";
import { functionReturnTypes } from "./function-return-types.ts";

RuleTester.describe = describe;
RuleTester.it = it;

new RuleTester().run("function-return-types", functionReturnTypes, {
  valid: [
    { code: "export function read(): number { return 1; }", filename: "/app/src/lib/a.ts" },
    { code: "export function Tile() { return null; }", filename: "/app/src/components/tile.tsx" },
    { code: "function read() { return 1; }", filename: "/app/src/lib/a.ts" },
    {
      code: "export function albumQuery(id) { return queryOptions({ queryKey: [id] }); }",
      filename: "/app/src/lib/a.ts",
    },
  ],
  invalid: [
    {
      code: "export function read() { return 1; }",
      filename: "/app/src/lib/a.ts",
      errors: [{ messageId: "missing" }],
    },
    {
      code: "export function Tile(): null { return null; }",
      filename: "/app/src/components/tile.tsx",
      output: "export function Tile() { return null; }",
      errors: [{ messageId: "component" }],
    },
  ],
});
