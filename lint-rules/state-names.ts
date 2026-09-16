import type { Rule } from "./types.ts";

const HANDLE_PREFIX = /^handle[A-Z]/;

function capitalize(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export const stateNames: Rule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Name a state setter set plus the state name, the reduced motion flag prefersReducedMotion, and a handler by what it does.",
    },
    messages: {
      setter: "Name this setter {{ expected }}.",
      reducedMotion: "Name this value prefersReducedMotion.",
      handler: "Name {{ name }} by what it does, without the handle prefix.",
    },
    schema: [],
  },
  create(context) {
    function checkHandler(node: { name: string; range: [number, number] }): void {
      if (HANDLE_PREFIX.test(node.name)) {
        context.report({ node, messageId: "handler", data: { name: node.name } });
      }
    }

    return {
      FunctionDeclaration(node) {
        if (node.id) {
          checkHandler(node.id);
        }
      },
      VariableDeclarator(node) {
        const init = node.init;

        if (node.id.type === "Identifier") {
          checkHandler(node.id);
        }

        if (init?.type !== "CallExpression" || init.callee.type !== "Identifier") {
          return;
        }

        if (init.callee.name === "useReducedMotion") {
          if (node.id.type === "Identifier" && node.id.name !== "prefersReducedMotion") {
            context.report({ node: node.id, messageId: "reducedMotion" });
          }

          return;
        }

        if (init.callee.name !== "useState" || node.id.type !== "ArrayPattern") {
          return;
        }

        const [value, setter] = node.id.elements;

        if (value?.type !== "Identifier" || setter?.type !== "Identifier") {
          return;
        }

        const expected = `set${capitalize(value.name)}`;

        if (setter.name !== expected) {
          context.report({ node: setter, messageId: "setter", data: { expected } });
        }
      },
    };
  },
};
