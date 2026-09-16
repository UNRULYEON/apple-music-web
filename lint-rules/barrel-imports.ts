import { existsSync, statSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import type { Rule } from "./types.ts";

const EXTENSIONS = [".ts", ".tsx"];
const BARREL_ROOTS = ["components", "hooks", "contexts"];
const VENDORED = "components/ui";

function isFile(path: string): boolean {
  return existsSync(path) && statSync(path).isFile();
}

function findSource(base: string): string | undefined {
  const candidates = [
    ...EXTENSIONS.map((extension) => `${base}${extension}`),
    ...EXTENSIONS.map((extension) => join(base, `index${extension}`)),
    base,
  ];

  return candidates.find(isFile);
}

function isBarrelFolder(src: string, folder: string): boolean {
  const path = relative(src, folder);
  const isInRoot = BARREL_ROOTS.some((root) => path === root || path.startsWith(`${root}/`));

  return (
    isInRoot &&
    !path.startsWith(VENDORED) &&
    EXTENSIONS.some((extension) => isFile(join(folder, `index${extension}`)))
  );
}

function withoutExtension(path: string): string {
  return path.replace(/\.tsx?$/, "");
}

export const barrelImports: Rule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Import a barrel folder through its barrel from outside, a sibling with ./ from inside, and everything else with @/.",
    },
    fixable: "code",
    messages: {
      useSpecifier: 'Import from "{{ expected }}".',
      ownBarrel: "Import a sibling file directly, not the barrel of this folder.",
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename;
    const at = filename.lastIndexOf("/src/");

    if (at === -1) {
      return {};
    }

    const src = filename.slice(0, at + 4);
    const importer = dirname(filename);

    function check(source: { value: unknown; range: [number, number] } | null | undefined): void {
      if (!source || typeof source.value !== "string") {
        return;
      }

      const [path, query] = source.value.split("?");

      if (!path.startsWith(".") && !path.startsWith("@/")) {
        return;
      }

      const base = path.startsWith("@/") ? join(src, path.slice(2)) : join(importer, path);
      const target = findSource(base);

      if (!target) {
        return;
      }

      const folder = dirname(target);
      const isIndex = withoutExtension(basename(target)) === "index";
      let expected: string;

      if (isIndex && isBarrelFolder(src, folder)) {
        if (folder === importer) {
          context.report({ node: source, messageId: "ownBarrel" });
          return;
        }

        expected = `@/${relative(src, folder)}`;
      } else if (isBarrelFolder(src, folder)) {
        expected =
          folder === importer
            ? `./${withoutExtension(basename(target))}`
            : `@/${relative(src, folder)}`;
      } else {
        const inside = relative(src, target);
        expected = `@/${target.endsWith(".ts") || target.endsWith(".tsx") ? withoutExtension(inside) : inside}`;
      }

      if (query !== undefined) {
        expected = `${expected}?${query}`;
      }

      if (expected === source.value) {
        return;
      }

      context.report({
        node: source,
        messageId: "useSpecifier",
        data: { expected },
        fix: (fixer) => fixer.replaceTextRange(source.range, JSON.stringify(expected)),
      });
    }

    return {
      ImportDeclaration: (node) => check(node.source),
      ExportNamedDeclaration: (node) => check(node.source),
      ExportAllDeclaration: (node) => check(node.source),
    };
  },
};
