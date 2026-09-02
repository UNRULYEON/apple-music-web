#!/usr/bin/env bun

const CODE_FILE = /\.(ts|tsx|js|jsx|mts|cts|mjs|cjs|css)$/;
const COMMENT = /(?:^|[^:"'`\\])\/\/|\/\*/;

interface HookInput {
  tool_input?: {
    file_path?: unknown;
    content?: unknown;
    new_string?: unknown;
  };
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function findComments(source: string): Array<string> {
  return source
    .split("\n")
    .map((line, index) => ({ number: index + 1, text: line.trim() }))
    .filter(({ text }) => COMMENT.test(text))
    .map(({ number, text }) => `  line ${number}: ${text.slice(0, 100)}`);
}

function deny(reason: string): void {
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    }),
  );
}

async function readStdin(): Promise<string> {
  const chunks: Array<Buffer> = [];

  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

const raw = await readStdin();
let input: HookInput = {};

try {
  input = JSON.parse(raw) as HookInput;
} catch {
  process.exit(0);
}

const path = input.tool_input?.file_path;

if (!isString(path) || !CODE_FILE.test(path)) {
  process.exit(0);
}

const sources = [input.tool_input?.content, input.tool_input?.new_string].filter(isString);
const found = sources.flatMap(findComments);

if (found.length === 0) {
  process.exit(0);
}

deny(
  [
    "This project does not accept code comments. Remove them and write the edit again.",
    "",
    ...found,
    "",
    "Name things so the code explains itself. Ask the user if a comment is truly needed.",
  ].join("\n"),
);

export {};
