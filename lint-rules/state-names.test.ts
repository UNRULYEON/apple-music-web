import { RuleTester } from "oxlint/plugins-dev";
import { describe, it } from "vitest";
import { stateNames } from "./state-names.ts";

RuleTester.describe = describe;
RuleTester.it = it;

new RuleTester().run("state-names", stateNames, {
  valid: [
    "const [isOpen, setIsOpen] = useState(false);",
    "const prefersReducedMotion = useReducedMotion();",
    "function close() {}",
  ],
  invalid: [
    { code: "const [isOpen, setOpen] = useState(false);", errors: [{ messageId: "setter" }] },
    { code: "const reduceMotion = useReducedMotion();", errors: [{ messageId: "reducedMotion" }] },
    { code: "function handleClose() {}", errors: [{ messageId: "handler" }] },
  ],
});
