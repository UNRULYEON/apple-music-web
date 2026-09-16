export interface JobResult {
  name: string;
  passed: boolean;
  step?: string;
}

export function collectResults(lines: string[]): JobResult[] {
  const results = new Map<string, JobResult>();
  const lastFailedStep: Record<string, string> = {};

  for (const line of lines) {
    const label = /^(?:\*DRYRUN\*\s*)?\[([^\]]+)\]/.exec(line);
    if (!label) {
      continue;
    }
    const name = label[1].split("/").slice(1).join("/").trim().replace(/-\d+$/, "");

    const failure = /Failure - (?:Main|Post) (.+?)\s*\[/.exec(line);
    if (failure) {
      lastFailedStep[name] = failure[1];
    }

    const finished = /🏁\s+Job (succeeded|failed)/.exec(line);
    if (finished) {
      results.set(name, {
        name,
        passed: finished[1] === "succeeded",
        step: finished[1] === "failed" ? lastFailedStep[name] : undefined,
      });
    }
  }

  return [...results.values()];
}
