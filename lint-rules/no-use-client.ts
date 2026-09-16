import type { Rule } from "./types.ts";

export const noUseClient: Rule = {
  meta: {
    type: "suggestion",
    docs: { description: "Leave out the use client directive. This app has no server components." },
    fixable: "code",
    messages: { directive: "Remove the use client directive." },
    schema: [],
  },
  create(context) {
    return {
      ExpressionStatement(node) {
        if (node.directive === "use client") {
          context.report({ node, messageId: "directive", fix: (fixer) => fixer.remove(node) });
        }
      },
    };
  },
};
