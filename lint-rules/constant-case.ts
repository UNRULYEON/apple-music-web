import type { Rule } from "./types.ts";

const SCREAMING = /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/;
const PRIMITIVES = new Set(["Literal", "TemplateLiteral", "UnaryExpression"]);
const WRAPPERS = new Set(["TSAsExpression", "TSSatisfiesExpression"]);

interface Node {
  type: string;
}

function unwrap(node: Node): Node {
  if (WRAPPERS.has(node.type) && "expression" in node) {
    return unwrap(node.expression as Node);
  }

  return node;
}

function isPlainData(node: Node): boolean {
  const inner = unwrap(node);

  if (PRIMITIVES.has(inner.type)) {
    return true;
  }

  if ("elements" in inner && inner.type === "ArrayExpression") {
    const elements = inner.elements as (Node | null)[];
    return (
      elements.length > 0 && elements.every((element) => element !== null && isPlainData(element))
    );
  }

  if ("properties" in inner && inner.type === "ObjectExpression") {
    const properties = inner.properties as Node[];
    return (
      properties.length > 0 &&
      properties.every(
        (property) =>
          "value" in property &&
          property.type === "Property" &&
          isPlainData(property.value as Node),
      )
    );
  }

  return false;
}

export const constantCase: Rule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Name a module level constant that holds plain data in SCREAMING_SNAKE_CASE.",
    },
    messages: { name: "Name the constant {{ name }} in SCREAMING_SNAKE_CASE." },
    schema: [],
  },
  create(context) {
    return {
      VariableDeclaration(node) {
        const parent = node.parent;
        const isTopLevel =
          parent.type === "Program" ||
          (parent.type === "ExportNamedDeclaration" && parent.parent.type === "Program");

        if (!isTopLevel || node.kind !== "const") {
          return;
        }

        for (const declarator of node.declarations) {
          if (declarator.id.type !== "Identifier" || !declarator.init) {
            continue;
          }

          const name = declarator.id.name;

          if (isPlainData(declarator.init) && !SCREAMING.test(name)) {
            context.report({ node: declarator.id, messageId: "name", data: { name } });
          }
        }
      },
    };
  },
};
