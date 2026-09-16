#!/usr/bin/env bun

import { execFileSync, spawn, spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { parseArgs } from "node:util";
import * as prompts from "@clack/prompts";
import ora from "ora";
import pc from "picocolors";
import { collectErrors } from "./collect-errors.ts";
import { collectResults } from "./collect-results.ts";
import { formatDuration } from "./format-duration.ts";
import { isWorkflowFile } from "./is-workflow-file.ts";
import { matchWorkflow } from "./match-workflow.ts";
import { parseBranches } from "./parse-branches.ts";
import { parseEvents } from "./parse-events.ts";
import { stripAnsi } from "./strip-ansi.ts";

const WORKFLOW_DIR = ".github/workflows";
const RUNNER_IMAGE = "catthehacker/ubuntu:act-latest";
const ARCHITECTURES = ["linux/amd64", "linux/arm64"] as const;
const TAIL_LINES = 8;

type Architecture = (typeof ARCHITECTURES)[number];
type Target = { kind: "working-tree" } | { kind: "ref"; ref: string };

const HELP = `Runs a GitHub workflow locally against the code you choose.

Usage
  bun run ci:local [run|clean] [options] [-- <act args>]

Options
  -w, --workflow <name>  Workflow to run, with or without the extension
  -e, --event <name>     Event to trigger, taken from the workflow when left out
  -r, --ref <ref>        Branch, tag or commit to check, default the current branch
  -d, --dirty            Check the working tree, uncommitted changes included
  -a, --arch <name>      ${ARCHITECTURES.join(" or ")}, default ${ARCHITECTURES[0]}
  -n, --dry-run          Plan the jobs without running them
  -h, --help             Show this text

A remote ref such as origin/main is fetched first.
Without a command the script asks for each answer.`;

function git(args: string[], cwd?: string): string {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

function repoRoot(): string {
  return git(["rev-parse", "--show-toplevel"]);
}

function hasCommand(command: string): boolean {
  return spawnSync(command, ["--version"], { stdio: "ignore" }).status === 0;
}

function dockerHost(): string | undefined {
  if (process.env.DOCKER_HOST) {
    return process.env.DOCKER_HOST;
  }
  try {
    const format = "{{.Endpoints.docker.Host}}";
    const host = execFileSync("docker", ["context", "inspect", "--format", format], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return host || undefined;
  } catch {
    return undefined;
  }
}

function imageMatches(architecture: Architecture, env: NodeJS.ProcessEnv): boolean {
  try {
    const found = execFileSync(
      "docker",
      ["image", "inspect", RUNNER_IMAGE, "--format", "{{.Os}}/{{.Architecture}}"],
      { encoding: "utf8", env, stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
    return found === architecture;
  } catch {
    return false;
  }
}

function listWorkflows(root: string): string[] {
  const dir = join(root, WORKFLOW_DIR);
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir).filter(isWorkflowFile).toSorted();
}

function branches(root: string, remote: boolean): string[] {
  const args = ["branch", "--format=%(refname:short)"];
  if (remote) {
    args.splice(1, 0, "--remotes");
  }
  return parseBranches(git(args, root), remote);
}

function remoteOf(root: string, ref: string): string | undefined {
  const remotes = git(["remote"], root).split("\n").filter(Boolean);
  return remotes.find((remote) => ref.startsWith(`${remote}/`));
}

function resolveCommit(root: string, ref: string): string | undefined {
  try {
    return git(["rev-parse", "--verify", "--quiet", `${ref}^{commit}`], root);
  } catch {
    return undefined;
  }
}

function isDirty(root: string): boolean {
  return git(["status", "--porcelain"], root).length > 0;
}

function copyWorkingTree(root: string, repoDir: string): void {
  const listed = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { cwd: root, encoding: "utf8" },
  );

  for (const file of listed.split("\0").filter(Boolean)) {
    const source = join(root, file);
    const stats = lstatSync(source, { throwIfNoEntry: false });
    if (!stats) {
      continue;
    }
    const destination = join(repoDir, file);
    mkdirSync(dirname(destination), { recursive: true });
    if (stats.isSymbolicLink()) {
      symlinkSync(readlinkSync(source), destination);
      continue;
    }
    copyFileSync(source, destination);
    chmodSync(destination, stats.mode);
  }
}

function stop(message: string): never {
  prompts.cancel(message);
  process.exit(1);
}

async function ask<T>(prompt: () => Promise<T | symbol>): Promise<T> {
  if (!process.stdin.isTTY) {
    stop("This step needs a terminal. Pass the values as arguments, see --help.");
  }
  const value = await prompt();
  if (prompts.isCancel(value)) {
    prompts.cancel("Cancelled.");
    process.exit(0);
  }
  return value as T;
}

function cleanActDirectory(root: string): void {
  const actDir = join(root, ".local/act");
  if (!existsSync(actDir)) {
    prompts.log.info("Nothing to clean, .local/act does not exist.");
    return;
  }
  rmSync(actDir, { recursive: true, force: true });
  prompts.log.success("Removed .local/act.");
}

async function chooseTarget(root: string): Promise<Target> {
  const branch = git(["rev-parse", "--abbrev-ref", "HEAD"], root);
  const head = git(["log", "-1", "--format=%h %s"], root);
  const where = branch === "HEAD" ? "detached" : branch;
  const choice = await ask(() =>
    prompts.select({
      message: "What do you want to check?",
      initialValue: "head",
      options: [
        { value: "head", label: "Current branch", hint: `${where}, ${head}` },
        { value: "working-tree", label: "Working tree", hint: "uncommitted and untracked files" },
        { value: "local", label: "A local branch" },
        { value: "remote", label: "A remote branch" },
      ],
    }),
  );

  if (choice === "working-tree") {
    return { kind: "working-tree" };
  }
  if (choice === "head") {
    return { kind: "ref", ref: "HEAD" };
  }

  const found = branches(root, choice === "remote");
  if (found.length === 0) {
    stop(`No ${choice} branches found.`);
  }
  const ref = await ask(() =>
    prompts.select({
      message: choice === "remote" ? "Which remote branch?" : "Which local branch?",
      options: found.map((name) => ({ value: name, label: name })),
    }),
  );
  return { kind: "ref", ref };
}

function prepareCheckout(root: string, repoDir: string, target: Target): string {
  const actDir = dirname(repoDir);
  rmSync(repoDir, { recursive: true, force: true });
  mkdirSync(actDir, { recursive: true });
  git(["clone", "--quiet", "--no-checkout", root, repoDir]);

  if (target.kind === "working-tree") {
    copyWorkingTree(root, repoDir);
    return "working tree";
  }

  const remote = remoteOf(root, target.ref);
  if (remote) {
    try {
      git(["fetch", "--quiet", remote, target.ref.slice(remote.length + 1)], root);
    } catch {
      prompts.log.warn(`Could not reach ${remote}, using the last fetched state.`);
    }
  }

  const commit = resolveCommit(root, target.ref);
  if (!commit) {
    stop(`Unknown ref "${target.ref}".`);
  }
  git(["checkout", "--quiet", "--detach", commit], repoDir);
  const branch = git(["rev-parse", "--abbrev-ref", "HEAD"], root);
  const label = target.ref === "HEAD" && branch !== "HEAD" ? branch : target.ref;
  return `${label} at ${commit.slice(0, 7)}`;
}

function createLiveTail(): { push: (line: string) => void; stop: () => void } {
  const live = process.stdout.isTTY === true;
  const buffer: string[] = [];
  const started = Date.now();
  const spinner = ora({ isEnabled: live, discardStdin: false });

  function paint(): void {
    const width = Math.max((process.stdout.columns ?? 80) - 5, 20);
    const shown = buffer
      .slice(-TAIL_LINES)
      .map((line) => `${pc.gray("│")}  ${pc.dim(line.slice(0, width))}`);
    spinner.text = [` Running act, ${formatDuration(Date.now() - started)}`, ...shown].join("\n");
  }

  paint();
  spinner.start();
  const timer = live ? setInterval(paint, 250) : undefined;

  return {
    push(line: string): void {
      if (!line.trim()) {
        return;
      }
      buffer.push(line);
      if (live) {
        paint();
      } else {
        console.log(line);
      }
    },
    stop(): void {
      if (timer) {
        clearInterval(timer);
      }
      spinner.stop();
    },
  };
}

function runAct(
  args: string[],
  cwd: string,
  env: NodeJS.ProcessEnv,
): Promise<{
  status: number;
  lines: string[];
}> {
  return new Promise((resolve) => {
    const child = spawn("act", args, { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
    const tail = createLiveTail();
    const lines: string[] = [];
    let pending = "";

    function consume(chunk: Buffer): void {
      pending += chunk.toString();
      const parts = pending.split(/\r\n|\r|\n/);
      pending = parts.pop() ?? "";
      for (const part of parts) {
        const line = stripAnsi(part).trimEnd();
        lines.push(line);
        tail.push(line);
      }
    }

    child.stdout.on("data", consume);
    child.stderr.on("data", consume);
    child.on("close", (code) => {
      if (pending) {
        lines.push(stripAnsi(pending));
      }
      tail.stop();
      resolve({ status: code ?? 1, lines });
    });
  });
}

function writeLog(actDir: string, name: string, lines: string[]): string {
  const logDir = join(actDir, "logs");
  mkdirSync(logDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const path = join(logDir, `${stamp}-${name}.log`);
  writeFileSync(path, `${lines.join("\n")}\n`);
  return path;
}

async function runWorkflow(
  root: string,
  workflow: string,
  event: string,
  target: Target,
  architecture: Architecture,
  dryRun: boolean,
  extraArgs: string[],
): Promise<number> {
  const actDir = join(root, ".local/act");
  const repoDir = join(actDir, "repo");

  prompts.log.step(`Checking ${prepareCheckout(root, repoDir, target)}`);

  const host = dockerHost();
  const env = host ? { ...process.env, DOCKER_HOST: host } : process.env;

  const args = [
    event,
    "-W",
    join(WORKFLOW_DIR, workflow),
    "-P",
    `ubuntu-latest=${RUNNER_IMAGE}`,
    "--container-architecture",
    architecture,
    "--cache-server-path",
    join(actDir, "cache", architecture.replace("/", "-")),
    "--action-cache-path",
    join(actDir, "actions"),
    "--action-offline-mode",
    ...(imageMatches(architecture, env) ? ["--pull=false"] : []),
    ...(dryRun ? ["-n"] : []),
    ...extraArgs,
  ];

  const started = Date.now();
  let outcome: { status: number; lines: string[] };
  try {
    outcome = await runAct(args, repoDir, env);
  } finally {
    rmSync(repoDir, { recursive: true, force: true });
  }

  const name = `${workflow.replace(/\.ya?ml$/, "")}-${event}`;
  const logPath = writeLog(actDir, name, outcome.lines);
  const results = collectResults(outcome.lines);
  const width = Math.max(...results.map((job) => job.name.length), 0);

  const body = [
    ...results.map((job) => {
      const mark = job.passed ? pc.green("✔") : pc.red("✖");
      const suffix = job.step ? `  ${job.step}` : "";
      return `${mark} ${job.name.padEnd(width)}${suffix}`;
    }),
    ...collectErrors(outcome.lines).flatMap((error) => ["", error]),
    "",
    pc.dim(`Log  ${logPath.replace(`${root}/`, "")}`),
  ];

  const passed = results.filter((job) => job.passed).length;
  const heading = `${passed}/${results.length} jobs passed in ${formatDuration(Date.now() - started)}`;
  prompts.note(body.join("\n"), heading);

  return outcome.status;
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  const separator = argv.indexOf("--");
  const extraArgs = separator === -1 ? [] : argv.slice(separator + 1);

  const { values, positionals } = parseArgs({
    args: separator === -1 ? argv : argv.slice(0, separator),
    allowPositionals: true,
    options: {
      workflow: { type: "string", short: "w" },
      event: { type: "string", short: "e" },
      ref: { type: "string", short: "r" },
      dirty: { type: "boolean", short: "d", default: false },
      arch: { type: "string", short: "a" },
      "dry-run": { type: "boolean", short: "n", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  if (values.help) {
    console.log(HELP);
    return 0;
  }

  const root = repoRoot();
  const given = positionals[0];
  if (given && given !== "run" && given !== "clean") {
    console.error(`Unknown command "${given}". Use run or clean, or --help.`);
    return 1;
  }
  if (values.dirty && values.ref) {
    console.error("Use --dirty or --ref, not both.");
    return 1;
  }

  prompts.intro("Local CI");

  const action =
    given ??
    (await ask(() =>
      prompts.select({
        message: "What do you want to do?",
        options: [
          { value: "run", label: "Run a workflow" },
          { value: "clean", label: "Clean .local/act", hint: "checkouts and act caches" },
        ],
      }),
    ));

  if (action === "clean") {
    cleanActDirectory(root);
    prompts.outro("Done.");
    return 0;
  }

  if (!hasCommand("act")) {
    stop("act is not installed. Run: brew install act");
  }

  const workflows = listWorkflows(root);
  if (workflows.length === 0) {
    stop(`No workflows found in ${WORKFLOW_DIR}.`);
  }

  const workflow = values.workflow
    ? (matchWorkflow(workflows, values.workflow) ??
      stop(`Unknown workflow "${values.workflow}". Found: ${workflows.join(", ")}`))
    : await ask(() =>
        prompts.select({
          message: "Which workflow?",
          options: workflows.map((name) => ({ value: name, label: name })),
        }),
      );

  const events = parseEvents(readFileSync(join(root, WORKFLOW_DIR, workflow), "utf8"));
  let event = values.event;
  if (!event) {
    event =
      events.length <= 1
        ? (events[0] ?? "push")
        : await ask(() =>
            prompts.select({
              message: "Which event?",
              options: events.map((name) => ({ value: name, label: name })),
            }),
          );
  }

  const interactive = given === undefined;

  let target: Target = { kind: "ref", ref: "HEAD" };
  if (values.dirty) {
    target = { kind: "working-tree" };
  } else if (values.ref) {
    target = { kind: "ref", ref: values.ref };
  } else if (interactive) {
    target = await chooseTarget(root);
  }

  if (target.kind === "ref" && isDirty(root)) {
    const how = interactive ? "Pick Working tree" : "Pass --dirty";
    prompts.log.warn(
      `Uncommitted and untracked files are not part of this run. ${how} to include them.`,
    );
  }

  let architecture: Architecture = ARCHITECTURES[0];
  if (values.arch) {
    if (!ARCHITECTURES.includes(values.arch as Architecture)) {
      stop(`Unknown architecture "${values.arch}". Use ${ARCHITECTURES.join(" or ")}.`);
    }
    architecture = values.arch as Architecture;
  } else if (interactive) {
    architecture = await ask(() =>
      prompts.select({
        message: "Which container architecture?",
        options: [
          { value: ARCHITECTURES[0], label: ARCHITECTURES[0], hint: "matches GitHub, emulated" },
          { value: ARCHITECTURES[1], label: ARCHITECTURES[1], hint: "native and faster" },
        ],
      }),
    );
  }

  let dryRun = values["dry-run"];
  if (!dryRun && interactive) {
    dryRun = await ask(() => prompts.confirm({ message: "Dry run?", initialValue: false }));
  }

  prompts.log.step(`act ${event} on ${workflow}${dryRun ? " (dry run)" : ""}`);
  const status = await runWorkflow(root, workflow, event, target, architecture, dryRun, extraArgs);
  if (status === 0) {
    prompts.outro("Workflow passed.");
  } else {
    prompts.cancel("Workflow failed.");
  }
  return status;
}

process.exit(await main());
