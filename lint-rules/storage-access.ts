import type { Rule } from "./types.ts";

const STORAGES = new Set(["localStorage", "sessionStorage"]);

export const storageAccess: Rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Reach browser storage only through src/lib/storage/local.ts, which never throws.",
    },
    messages: {
      storage: "Use readStorage, writeStorage or removeStorage from @/lib/storage/local.",
    },
    schema: [],
  },
  create(context) {
    if (context.filename.endsWith("/src/lib/storage/local.ts")) {
      return {};
    }

    return {
      Identifier(node) {
        if (STORAGES.has(node.name)) {
          context.report({ node, messageId: "storage" });
        }
      },
    };
  },
};
