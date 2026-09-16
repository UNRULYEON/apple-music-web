import type { Rule } from "./types.ts";

export const queryKeys: Rule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Build queries with a factory in src/lib, never inline in a component or hook.",
    },
    messages: { inline: "Move this query to a query factory in src/lib." },
    schema: [],
  },
  create(context) {
    if (context.filename.includes("/src/lib/")) {
      return {};
    }

    return {
      Property(node) {
        if (node.key.type === "Identifier" && node.key.name === "queryKey" && !node.computed) {
          context.report({ node, messageId: "inline" });
        }
      },
    };
  },
};
