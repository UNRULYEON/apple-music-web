// Built without a literal escape so the source holds no control character.
const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[\\d;?]*[A-Za-z]`, "g");

export function stripAnsi(text: string): string {
  return text.replace(ANSI, "");
}
