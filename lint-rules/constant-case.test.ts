import { RuleTester } from "oxlint/plugins-dev";
import { describe, it } from "vitest";
import { constantCase } from "./constant-case.ts";

RuleTester.describe = describe;
RuleTester.it = it;

new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } }).run(
  "constant-case",
  constantCase,
  {
    valid: [
      "const LIMIT = 25;",
      'export const STORAGE_KEY = "theme" as const;',
      "const listeners = new Set();",
      "export const Route = createFileRoute();",
      "function read() { const limit = 25; return limit; }",
      "const seen = [];",
      "export const EmptyStates = { NoAlbums, NoArtists };",
      "export const rule = { create() { return {}; } };",
    ],
    invalid: [
      { code: "const limit = 25;", errors: [{ messageId: "name" }] },
      { code: "export const preHydrationScript = `try{}`;", errors: [{ messageId: "name" }] },
      { code: "const steps = { left: -1 } as const;", errors: [{ messageId: "name" }] },
    ],
  },
);
