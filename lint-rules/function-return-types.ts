import type { Rule } from "./types.ts";

const COMPONENT = /^[A-Z]/;

interface Statement {
  type: string;
  argument?: { type: string; callee?: { type: string; name?: string } } | null;
}

function returnsQueryOptions(body: { body: Statement[] } | null | undefined): boolean {
  const last = body?.body.at(-1);
  const callee = last?.type === "ReturnStatement" ? last.argument?.callee : undefined;

  return callee?.type === "Identifier" && callee.name === "queryOptions";
}

export const functionReturnTypes: Rule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Give an exported function a return type, and leave it off an exported component.",
    },
    fixable: "code",
    messages: {
      missing: "Give the exported function {{ name }} a return type.",
      component: "Remove the return type of the component {{ name }}.",
    },
    schema: [],
  },
  create(context) {
    const isJsx = context.filename.endsWith(".tsx");

    return {
      ExportNamedDeclaration(node) {
        const declaration = node.declaration;

        if (declaration?.type !== "FunctionDeclaration" || !declaration.id) {
          return;
        }

        const name = declaration.id.name;
        const returnType = declaration.returnType;

        if (isJsx && COMPONENT.test(name)) {
          if (returnType) {
            context.report({
              node: returnType,
              messageId: "component",
              data: { name },
              fix: (fixer) => fixer.remove(returnType),
            });
          }

          return;
        }

        if (!returnType && !returnsQueryOptions(declaration.body as { body: Statement[] } | null)) {
          context.report({ node: declaration.id, messageId: "missing", data: { name } });
        }
      },
    };
  },
};
