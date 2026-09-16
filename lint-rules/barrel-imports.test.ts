import { join } from "node:path";
import { RuleTester } from "oxlint/plugins-dev";
import { describe, it } from "vitest";
import { barrelImports } from "./barrel-imports.ts";

RuleTester.describe = describe;
RuleTester.it = it;

const SRC = join(import.meta.dirname, "../src");
const DETAILS = join(SRC, "components/details/album-details.tsx");
const LIB = join(SRC, "lib/format.ts");

new RuleTester().run("barrel-imports", barrelImports, {
  valid: [
    { code: 'import { useView } from "@/hooks";', filename: DETAILS },
    { code: 'import { TrackList } from "./track-list";', filename: DETAILS },
    { code: 'import { Button } from "@/components/ui/button";', filename: DETAILS },
    { code: 'import { cn } from "@/lib/utils";', filename: LIB },
    { code: 'import { useState } from "react";', filename: LIB },
  ],
  invalid: [
    {
      code: 'import { useView } from "@/hooks/use-view";',
      filename: DETAILS,
      output: 'import { useView } from "@/hooks";',
      errors: [{ messageId: "useSpecifier" }],
    },
    {
      code: 'import { TrackList } from "@/components/details/track-list";',
      filename: DETAILS,
      output: 'import { TrackList } from "./track-list";',
      errors: [{ messageId: "useSpecifier" }],
    },
    {
      code: 'import { ArtworkImage } from "../artwork";',
      filename: DETAILS,
      output: 'import { ArtworkImage } from "@/components";',
      errors: [{ messageId: "useSpecifier" }],
    },
    {
      code: 'import { cn } from "./utils";',
      filename: LIB,
      output: 'import { cn } from "@/lib/utils";',
      errors: [{ messageId: "useSpecifier" }],
    },
    {
      code: 'import { TrackList } from "@/components/details";',
      filename: DETAILS,
      errors: [{ messageId: "ownBarrel" }],
    },
  ],
});
