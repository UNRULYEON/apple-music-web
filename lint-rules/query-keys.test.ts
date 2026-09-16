import { RuleTester } from "oxlint/plugins-dev";
import { describe, it } from "vitest";
import { queryKeys } from "./query-keys.ts";

RuleTester.describe = describe;
RuleTester.it = it;

new RuleTester().run("query-keys", queryKeys, {
  valid: [
    { code: 'const query = { queryKey: ["a"] };', filename: "/app/src/lib/music-kit/album.ts" },
    { code: "useQuery(albumQuery(id));", filename: "/app/src/components/album.tsx" },
  ],
  invalid: [
    {
      code: 'useQuery({ queryKey: ["a"], queryFn });',
      filename: "/app/src/components/album.tsx",
      errors: [{ messageId: "inline" }],
    },
  ],
});
