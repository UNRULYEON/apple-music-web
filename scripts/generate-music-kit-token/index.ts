#!/usr/bin/env bun

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
import { parseArgs } from "node:util";
import * as prompts from "@clack/prompts";
import { hasToken, mergeDevVars, VARIABLE } from "./dev-vars";
import { keyIdFromFileName, signDeveloperToken } from "./sign";

const ROOT = join(import.meta.dirname, "../..");

const { values } = parseArgs({
  options: {
    key: { type: "string", short: "k" },
    "team-id": { type: "string", short: "t" },
    "key-id": { type: "string", short: "i" },
    help: { type: "boolean", short: "h" },
  },
});

if (values.help) {
  usage();
  process.exit(0);
}

const flagKeyPath = values.key ?? process.env.APPLE_PRIVATE_KEY_PATH;
const flagTeamId = values["team-id"] ?? process.env.APPLE_TEAM_ID;

if (flagKeyPath && flagTeamId) {
  const keyId = givenKeyId(flagKeyPath);

  if (!keyId) {
    console.error("Give the Key ID with --key-id. It is only read from an AuthKey_<id>.p8 name.");
    process.exit(1);
  }

  console.log(await sign(flagKeyPath, flagTeamId, keyId));
  process.exit(0);
}

await run();

async function run(): Promise<void> {
  prompts.intro("MusicKit developer token");

  const keyPath = flagKeyPath ?? (await chooseKeyFile());
  const keyId = givenKeyId(keyPath) ?? (await askKeyId());
  const teamId = flagTeamId ?? (await askTeamId());

  const spinner = prompts.spinner();
  spinner.start("Signing the token");

  const token = await sign(keyPath, teamId, keyId).catch((cause: unknown) => {
    spinner.stop("Could not sign the token.");
    stop(cause instanceof Error ? cause.message : String(cause));
  });

  spinner.stop(`Signed with key ${keyId} for team ${teamId}.`);
  prompts.log.info(`It stops working on ${expiryDate()}. Make a new one before then.`);

  await deliver(token);
}

async function deliver(token: string): Promise<void> {
  const choice = await ask(() =>
    prompts.select({
      message: "What do you want to do with it?",
      initialValue: "dev-vars",
      options: [
        { value: "dev-vars", label: "Write it to .dev.vars", hint: "for bun dev" },
        { value: "secret", label: "Send it to Cloudflare", hint: "wrangler secret put" },
        { value: "print", label: "Print it" },
      ],
    }),
  );

  if (choice === "dev-vars") {
    await writeDevVars(token);
    prompts.outro("Run bun dev and sign in.");
    return;
  }

  if (choice === "secret") {
    await putSecret(token);
    return;
  }

  prompts.outro("Here is the token.");
  console.log(token);
}

async function writeDevVars(token: string): Promise<void> {
  const path = join(ROOT, ".dev.vars");
  const existing = existsSync(path) ? readFileSync(path, "utf8") : "";

  if (hasToken(existing)) {
    const replace = await ask(() =>
      prompts.confirm({ message: `.dev.vars already holds a ${VARIABLE}. Replace it?` }),
    );

    if (!replace) {
      stop("Kept the token that was there.");
    }
  }

  writeFileSync(path, mergeDevVars(existing, token));
  prompts.log.success(`Wrote ${VARIABLE} to .dev.vars.`);
}

async function putSecret(token: string): Promise<void> {
  const confirmed = await ask(() =>
    prompts.confirm({
      message: "This replaces the secret on the deployed Worker. Continue?",
      initialValue: false,
    }),
  );

  if (!confirmed) {
    stop("Nothing was sent.");
  }

  const result = spawnSync("bunx", ["wrangler", "secret", "put", VARIABLE], {
    cwd: ROOT,
    input: token,
    stdio: ["pipe", "inherit", "inherit"],
  });

  if (result.status !== 0) {
    stop("Wrangler could not store the secret.");
  }

  prompts.outro("The Worker has the new token.");
}

async function chooseKeyFile(): Promise<string> {
  const found = findKeyFiles();

  if (found.length > 0) {
    const choice = await ask(() =>
      prompts.select({
        message: "Which MusicKit key do you want to use?",
        options: [
          ...found.map((path) => ({ value: path, label: basename(path), hint: dirname(path) })),
          { value: "", label: "Another path" },
        ],
      }),
    );

    if (choice) {
      return choice;
    }
  }

  return await askKeyPath();
}

function findKeyFiles(): Array<string> {
  const found: Array<string> = [];

  for (const directory of [process.cwd(), join(homedir(), "Downloads")]) {
    try {
      for (const name of readdirSync(directory)) {
        if (/^AuthKey_.+\.p8$/.test(name)) {
          found.push(join(directory, name));
        }
      }
    } catch {}
  }

  return found;
}

async function askKeyPath(): Promise<string> {
  const value = await ask(() =>
    prompts.text({
      message: "Where is your MusicKit key (.p8)?",
      placeholder: "~/Downloads/AuthKey_ABC1234DEF.p8",
      validate(input) {
        const path = expandHome(input ?? "");

        if (!path) {
          return "Give the path to the .p8 file from the Apple Developer portal.";
        }

        return existsSync(path) ? undefined : `There is no file at ${path}.`;
      },
    }),
  );

  return expandHome(value);
}

async function askKeyId(): Promise<string> {
  const value = await ask(() =>
    prompts.text({
      message: "What is the Key ID?",
      placeholder: "ABC1234DEF",
      validate: (input) =>
        input?.trim() ? undefined : "The Key ID is next to the key in the Apple Developer portal.",
    }),
  );

  return value.trim();
}

async function askTeamId(): Promise<string> {
  const value = await ask(() =>
    prompts.text({
      message: "What is your Apple Team ID?",
      placeholder: "ABCDE12345",
      validate: (input) => (input?.trim() ? undefined : "The Team ID is on the Membership page."),
    }),
  );

  return value.trim();
}

function givenKeyId(keyPath: string): string | undefined {
  return values["key-id"] ?? process.env.APPLE_KEY_ID ?? keyIdFromFileName(basename(keyPath));
}

function sign(keyPath: string, teamId: string, keyId: string): Promise<string> {
  return signDeveloperToken({ teamId, keyId, privateKeyPem: readFileSync(keyPath, "utf8") });
}

function expiryDate(): string {
  const expiry = new Date(Date.now() + 15_777_000 * 1000);
  return expiry.toISOString().slice(0, 10);
}

function expandHome(path: string): string {
  const trimmed = path.trim();
  return trimmed.startsWith("~/") ? join(homedir(), trimmed.slice(2)) : trimmed;
}

function stop(message: string): never {
  prompts.cancel(message);
  process.exit(1);
}

async function ask<T>(prompt: () => Promise<T | symbol>): Promise<T> {
  if (!process.stdin.isTTY) {
    stop("This step needs a terminal. Pass --key and --team-id instead, see --help.");
  }

  const value = await prompt();

  if (prompts.isCancel(value)) {
    prompts.cancel("Cancelled.");
    process.exit(0);
  }

  return value as T;
}

function usage(): void {
  console.error("Makes an Apple Music developer token (ES256 JWT) from a MusicKit .p8 key.");
  console.error("");
  console.error("Run it without arguments and it asks for what it needs:");
  console.error("  bun run generate-music-kit-token");
  console.error("");
  console.error("Give both --key and --team-id and it only prints the token, for a pipe:");
  console.error(
    "  bun run generate-music-kit-token --key <path to .p8> --team-id <team id> [--key-id <id>]",
  );
  console.error("");
  console.error("The Key ID is read from an AuthKey_<id>.p8 file name when you leave it out.");
  console.error("You can also set APPLE_PRIVATE_KEY_PATH, APPLE_TEAM_ID and APPLE_KEY_ID.");
}
