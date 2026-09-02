export function parseBranches(output: string, remote: boolean): Array<string> {
  return output
    .split("\n")
    .map((name) => name.trim())
    .filter((name) => name && !name.includes("->") && (!remote || name.includes("/")))
    .toSorted();
}
