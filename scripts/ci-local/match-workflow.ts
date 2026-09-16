export function matchWorkflow(names: string[], wanted: string): string | undefined {
  return names.find((name) => name === wanted || name.replace(/\.ya?ml$/, "") === wanted);
}
