export function matchesSearch(term: string, ...fields: (string | undefined)[]): boolean {
  const wanted = plain(term);

  if (wanted === "") {
    return true;
  }

  return fields.some((field) => field !== undefined && plain(field).includes(wanted));
}

function plain(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}
