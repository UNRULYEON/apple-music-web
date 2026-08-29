export function parseBranches(output: string, remote: boolean): Array<string> {
  return (
    output
      .split("\n")
      .map((name) => name.trim())
      // A remote HEAD shows up as the bare remote name, such as "origin".
      .filter((name) => name && !name.includes("->") && (!remote || name.includes("/")))
      .toSorted()
  );
}
