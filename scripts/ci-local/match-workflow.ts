export function matchWorkflow(names: Array<string>, wanted: string): string | undefined {
  return names.find((name) => name === wanted || name.replace(/\.ya?ml$/, "") === wanted);
}
