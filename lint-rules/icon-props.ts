import type { Rule } from "./types.ts";

const ICON = "HugeiconsIcon";

export const iconProps: Rule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Give every icon a stroke width, and hide it from screen readers unless it has a label.",
    },
    fixable: "code",
    messages: {
      strokeWidth: "Give the icon an explicit strokeWidth.",
      ariaHidden: 'Give the icon aria-hidden="true", or an aria-label when it carries meaning.',
    },
    schema: [],
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (node.name.type !== "JSXIdentifier" || node.name.name !== ICON) {
          return;
        }

        const names = new Set(
          node.attributes.flatMap((attribute) =>
            attribute.type === "JSXAttribute" && attribute.name.type === "JSXIdentifier"
              ? [attribute.name.name]
              : [],
          ),
        );

        const last = node.attributes.at(-1) ?? node.name;
        const hasSpread = node.attributes.some(
          (attribute) => attribute.type === "JSXSpreadAttribute",
        );

        if (hasSpread) {
          return;
        }

        if (!names.has("strokeWidth")) {
          context.report({
            node,
            messageId: "strokeWidth",
            fix: (fixer) => fixer.insertTextAfter(last, " strokeWidth={1.5}"),
          });
        }

        if (!names.has("aria-hidden") && !names.has("aria-label")) {
          context.report({
            node,
            messageId: "ariaHidden",
            fix: (fixer) => fixer.insertTextAfter(last, ' aria-hidden="true"'),
          });
        }
      },
    };
  },
};
