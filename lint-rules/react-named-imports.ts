import type { Rule } from "./types.ts";

const MESSAGE = "Import what you need from react by name instead of the React namespace.";

export const reactNamedImports: Rule = {
  meta: {
    type: "suggestion",
    docs: { description: "Import from react by name, and never through the React namespace." },
    messages: { named: MESSAGE },
    schema: [],
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        if (node.source.value !== "react") {
          return;
        }

        for (const specifier of node.specifiers) {
          if (specifier.type !== "ImportSpecifier") {
            context.report({ node: specifier, messageId: "named" });
          }
        }
      },
      TSQualifiedName(node) {
        if (node.left.type === "Identifier" && node.left.name === "React") {
          context.report({ node, messageId: "named" });
        }
      },
      MemberExpression(node) {
        if (node.object.type === "Identifier" && node.object.name === "React") {
          context.report({ node, messageId: "named" });
        }
      },
    };
  },
};
