import { RuleTester } from "oxlint/plugins-dev";
import { describe, it } from "vitest";
import { iconProps } from "./icon-props.ts";

RuleTester.describe = describe;
RuleTester.it = it;

const TSX = "/app/src/components/a.tsx";

new RuleTester().run("icon-props", iconProps, {
  valid: [
    {
      code: 'const a = <HugeiconsIcon icon={A} strokeWidth={2} aria-hidden="true" />;',
      filename: TSX,
    },
    {
      code: 'const a = <HugeiconsIcon icon={A} strokeWidth={2} aria-label="Explicit" />;',
      filename: TSX,
    },
  ],
  invalid: [
    {
      code: 'const a = <HugeiconsIcon icon={A} aria-hidden="true" />;',
      filename: TSX,
      output: 'const a = <HugeiconsIcon icon={A} aria-hidden="true" strokeWidth={1.5} />;',
      errors: [{ messageId: "strokeWidth" }],
    },
    {
      code: "const a = <HugeiconsIcon icon={A} strokeWidth={2} />;",
      filename: TSX,
      output: 'const a = <HugeiconsIcon icon={A} strokeWidth={2} aria-hidden="true" />;',
      errors: [{ messageId: "ariaHidden" }],
    },
  ],
});
