import { RuleTester } from "oxlint/plugins-dev";
import { describe, it } from "vitest";
import { storageAccess } from "./storage-access.ts";

RuleTester.describe = describe;
RuleTester.it = it;

new RuleTester().run("storage-access", storageAccess, {
  valid: [
    { code: 'localStorage.getItem("a");', filename: "/app/src/lib/storage/local.ts" },
    { code: 'readStorage("a");', filename: "/app/src/lib/theme.ts" },
  ],
  invalid: [
    {
      code: 'localStorage.getItem("a");',
      filename: "/app/src/lib/theme.ts",
      errors: [{ messageId: "storage" }],
    },
    {
      code: 'window.sessionStorage.setItem("a", "b");',
      filename: "/app/src/lib/theme.ts",
      errors: [{ messageId: "storage" }],
    },
  ],
});
