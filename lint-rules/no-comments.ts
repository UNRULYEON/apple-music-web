import type { Rule } from "./types.ts";

const DIRECTIVE = /^\s*(@vitest-environment|oxlint-disable|eslint-disable|@ts-expect-error)\b/;

export const noComments: Rule = {
  meta: {
    type: "suggestion",
    docs: { description: "Allow tool directives only. Name things so the code explains itself." },
    messages: { comment: "Remove this comment. Name things so the code explains itself." },
    schema: [],
  },
  create(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          if (comment.type !== "Shebang" && !DIRECTIVE.test(comment.value)) {
            context.report({ node: comment, messageId: "comment" });
          }
        }
      },
    };
  },
};
