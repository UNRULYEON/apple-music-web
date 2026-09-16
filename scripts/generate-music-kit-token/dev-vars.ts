export const VARIABLE = "MUSICKIT_DEVELOPER_TOKEN";

export function hasToken(existing: string): boolean {
  return lines(existing).some(isTokenLine);
}

export function mergeDevVars(existing: string, token: string): string {
  const entry = `${VARIABLE}="${token}"`;
  const merged = lines(existing);
  const index = merged.findIndex(isTokenLine);

  if (index === -1) {
    merged.push(entry);
  } else {
    merged[index] = entry;
  }

  return `${merged.join("\n")}\n`;
}

function lines(existing: string): string[] {
  const trimmed = existing.replace(/\n+$/, "");
  return trimmed ? trimmed.split("\n") : [];
}

function isTokenLine(line: string): boolean {
  return line.trimStart().startsWith(`${VARIABLE}=`);
}
