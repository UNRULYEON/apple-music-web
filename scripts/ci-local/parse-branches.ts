export function parseBranches(output: string, remote: boolean): string[] {
  return output
    .split("\n")
    .map((name) => name.trim())
    .filter((name) => name && !name.includes("->") && (!remote || name.includes("/")))
    .toSorted();
}
