import { RuleTester } from "oxlint/plugins-dev";
import { describe, it } from "vitest";
import { reactNamedImports } from "./react-named-imports.ts";

RuleTester.describe = describe;
RuleTester.it = it;

new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } }).run(
  "react-named-imports",
  reactNamedImports,
  {
    valid: ['import { useState, type ReactNode } from "react";'],
    invalid: [
      { code: 'import * as React from "react";', errors: [{ messageId: "named" }] },
      { code: 'import React from "react";', errors: [{ messageId: "named" }] },
      { code: "let node: React.ReactNode;", errors: [{ messageId: "named" }] },
      { code: "React.useState(1);", errors: [{ messageId: "named" }] },
    ],
  },
);
