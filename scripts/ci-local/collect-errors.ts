const MAX_ERRORS = 5;

export function collectErrors(lines: Array<string>): Array<string> {
  return lines
    .filter((line) => line.includes("::error"))
    .map((line) => line.replace(/^.*::error[^:]*::/, "").trim())
    .filter(Boolean)
    .slice(0, MAX_ERRORS);
}
